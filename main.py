from google.colab import drive
drive.mount('/content/drive')

# Install necessary libraries (uncomment if running in a new environment)
# !pip install fastapi uvicorn pyngrok nest-asyncio python-multipart transformers torch torchvision pillow numpy opencv-python-headless google-genai

import os
import io
import json
import re
import cv2
import numpy as np
import torch
import threading
import uvicorn
from pyngrok import ngrok
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from transformers import pipeline, SegformerImageProcessor, SegformerForSemanticSegmentation
from google import genai
from contextlib import asynccontextmanager

# 1. Credentials
GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE" # Replace with your actual Gemini API key
NGROK_AUTH_TOKEN = "YOUR_NGROK_AUTH_TOKEN_HERE" # Replace with your actual ngrok auth token

client = genai.Client(api_key=GEMINI_API_KEY)
ngrok.set_auth_token(NGROK_AUTH_TOKEN)

# 2. AI Models
class DepthEstimatorV2:
    def __init__(self):
        self.device = 0 if torch.cuda.is_available() else -1
        self.pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-small-hf", device=self.device)

    def estimate(self, image: Image.Image):
        result = self.pipe(image)
        return np.array(result["depth"])

class FoodSegmentor:
    def __init__(self, model_path="/content/drive/MyDrive/saved_food_segmentor"):
        self.processor = SegformerImageProcessor.from_pretrained(model_path)
        self.model = SegformerForSemanticSegmentation.from_pretrained(model_path)

    def segment(self, image: Image.Image):
        inputs = self.processor(images=image, return_tensors="pt")
        with torch.no_grad():
            outputs = self.model(**inputs)
        upsampled_logits = torch.nn.functional.interpolate(
            outputs.logits, size=image.size[::-1], mode="bilinear", align_corners=False
        )
        return upsampled_logits.argmax(dim=1)[0].cpu().numpy()

class ZeroShotClassifier:
    def __init__(self):
        self.device = 0 if torch.cuda.is_available() else -1
        self.pipe = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32", device=self.device)

    def classify(self, image: Image.Image, candidate_labels: list):
        results = self.pipe(image, candidate_labels=candidate_labels)
        return results[0]['label'], results[0]['score']


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    global depth_model, segmentor_model, clip_model
    depth_model = DepthEstimatorV2()
    segmentor_model = FoodSegmentor()
    clip_model = ZeroShotClassifier()
    print("All models loaded.")
    yield

# 3. FastAPI App
app = FastAPI(lifespan=lifespan)
depth_model, segmentor_model, clip_model = None, None, None


@app.post("/api/analyze-food")
async def analyze_food(file: UploadFile = File(...), candidate_labels: str = Form(...)):
    try:
        labels_list = json.loads(candidate_labels)
        image_bytes = await file.read()
        original_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_np = np.array(original_image)

        depth_map = depth_model.estimate(original_image)
        predicted_mask = segmentor_model.segment(original_image)

        unique_classes = np.unique(predicted_mask)
        detected_items_data = []

        for cls_id in unique_classes:
            if cls_id == 0: continue
            class_mask = (predicted_mask == cls_id).astype(np.uint8)
            pixel_count = np.sum(class_mask)
            coverage_percent = round((pixel_count / class_mask.size) * 100, 2)
            avg_depth = float(np.mean(depth_map[class_mask == 1]))

            masked_img_np = cv2.bitwise_and(image_np, image_np, mask=class_mask)
            masked_pil = Image.fromarray(masked_img_np)
            best_label, confidence = clip_model.classify(masked_pil, labels_list)

            if confidence > 0.15:
                detected_items_data.append({
                    "DetectedIngredient": best_label,
                    "ConfidenceScore": round(confidence, 4),
                    "ImageCoveragePercentage": coverage_percent,
                    "AverageDepthValue": round(avg_depth, 2)
                })

        prompt = f"""
        Role: You are an expert nutritionist and computer vision analyzer.
        Task: Analyze the provided food image along with the spatial data to estimate the weight (in grams) and calories for a SINGLE SERVING of the detected items.

        Spatial Data: {json.dumps(detected_items_data)}
        - 'ImageCoveragePercentage': Indicates how much of the camera frame the item occupies (2D scale).
        - 'AverageDepthValue': Indicates relative distance to the lens. Use this to correct perspective if a large object is just very close to the camera.

        Strict Constraints:
        1. Portion Scale: Assume the image is a standard, single-person meal unless clearly a large catering tray.
        2. Reference Object Scaling: Actively scan the image for objects with a universally known size (e.g., a bottle cap, a standard fork, or a coin). If present, use this object as your absolute baseline to calibrate the true physical volume of the food.
        3. Realistic Limits: A typical single food component usually weighs between 20g and 350g.
        4. Fallback to Standard: If your spatial estimation yields an unrealistic or extreme value (e.g., >400g for a standard ingredient) and you are not 70% certain of the scale, you MUST discard your calculation and default 'EstimatedGrams' to the standard, average single-serving weight for that specific food type.
        5. Close-up Correction: If no reference object is found, rely on visual textures (like rice grains, bread pores, or plate edges) to judge scale.
        6. Final Dish Naming: Name the items as they appear prepared and cooked (e.g., 'Cooked Chicken', 'Baked Crust') rather than raw base ingredients.
        {{ "Items": [ {{ "Name": "string", "EstimatedGrams": float, "Calories": float }} ], "TotalCalories": float }}
        """

        client = genai.Client(api_key=GEMINI_API_KEY)



        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, original_image]
        )
        response_text = response.text.strip()
        # 1. Use Regex to find the JSON block even if there is text around it
        # This looks for the first '{' and the last '}'
        match = re.search(r'\{.*\}', response_text, re.DOTALL)


        if match:
            json_str = match.group(0)
        else:
            json_str = response_text
        # 2. Parse the extracted string
        print(json_str)
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"DEBUG: Raw response was: {response_text}")
        print(f"DEBUG: Error details: {str(e)}")
        raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
    except Exception as e:
        # Catches general connection or API errors
        print(f"General Pipeline Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# 4. Ngrok & Server Execution
ngrok.kill()
ngrok_tunnel = ngrok.connect(8000)
print('URL:', ngrok_tunnel.public_url)

def run_server():
    uvicorn.run(app, host="0.0.0.0", port=8000)

threading.Thread(target=run_server, daemon=True).start()

import logging
from pyngrok import ngrok, conf

# Set up logging to the console
logger = logging.getLogger()
logger.setLevel(logging.INFO)
sh = logging.StreamHandler()
logger.addHandler(sh)

# Now when you connect, logs will stream in the output
public_url = ngrok.connect(8000)
print("Public URL:", public_url)