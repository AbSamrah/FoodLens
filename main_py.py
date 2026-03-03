import os
import io
import json
import re
import cv2
import numpy as np
import torch
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from transformers import pipeline, SegformerImageProcessor, SegformerForSemanticSegmentation
import google.generativeai as genai

# ==========================================
# 1. API Keys & Configurations
# ==========================================
GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE" # Put your key (I removed mine for security, but you should have your own)
genai.configure(api_key=GEMINI_API_KEY)

# ==========================================
# 2. AI Model Classes
# ==========================================
class DepthEstimatorV2:
    def __init__(self):
        self.device = 0 if torch.cuda.is_available() else -1
        self.pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-small-hf", device=self.device)
        print("Depth model loaded.")

    def estimate(self, image: Image.Image):
        result = self.pipe(image)
        return np.array(result["depth"])

class FoodSegmentor:
    def __init__(self, model_path="./saved_food_segmentor"):
        # Ensure this path points to your trained Segformer weights
        self.processor = SegformerImageProcessor.from_pretrained(model_path)
        self.model = SegformerForSemanticSegmentation.from_pretrained(model_path)
        print("Segmentation model loaded.")

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
        print("CLIP model loaded.")

    def classify(self, image: Image.Image, candidate_labels: list):
        results = self.pipe(image, candidate_labels=candidate_labels)
        # Return the label with the highest confidence score
        return results[0]['label'], results[0]['score']

# ==========================================
# 3. FastAPI Initialization
# ==========================================
app = FastAPI()

depth_model = None
segmentor_model = None
clip_model = None

@app.on_event("startup")
async def load_models():
    """Injects models into memory on startup to prevent cold-start latency."""
    global depth_model, segmentor_model, clip_model
    depth_model = DepthEstimatorV2()
    segmentor_model = FoodSegmentor()
    clip_model = ZeroShotClassifier()
    print("All models successfully loaded into memory.")

# ==========================================
# 4. The Pipeline Endpoint
# ==========================================
@app.post("/api/analyze-food")
async def analyze_food(
    file: UploadFile = File(...),
    candidate_labels: str = Form(...)
):
    try:
        # 1. Parse Data
        labels_list = json.loads(candidate_labels)
        image_bytes = await file.read()
        original_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_np = np.array(original_image)

        # 2. Generate Depth and Segmentation Maps
        depth_map = depth_model.estimate(original_image)
        predicted_mask = segmentor_model.segment(original_image)

        # 3. Process each isolated segment
        unique_classes = np.unique(predicted_mask)
        detected_items_data = []

        for cls_id in unique_classes:
            if cls_id == 0:
                continue

            # Create a binary mask for this specific food item
            class_mask = (predicted_mask == cls_id).astype(np.uint8)

            # Calculate mathematical volume approximations
            pixel_count = np.sum(class_mask)
            coverage_percent = round((pixel_count / class_mask.size) * 100, 2)
            avg_depth = float(np.mean(depth_map[class_mask == 1]))

            # Isolate the food item visually by blacking out the rest of the image
            masked_img_np = cv2.bitwise_and(image_np, image_np, mask=class_mask)
            masked_pil = Image.fromarray(masked_img_np)

            # Pass the isolated visual to CLIP
            best_label, confidence = clip_model.classify(masked_pil, labels_list)

            # Only keep confident predictions
            if confidence > 0.15:
                detected_items_data.append({
                    "DetectedIngredient": best_label,
                    "ConfidenceScore": round(confidence, 4),
                    "ImageCoveragePercentage": coverage_percent,
                    "AverageDepthValue": round(avg_depth, 2)
                })

        # 4. Nutritional Reasoning via Gemini
        prompt = f"""
        You are an expert nutritionist system. I am providing an image of a meal and spatial data extracted by a computer vision pipeline.

        Computer Vision Data:
        {json.dumps(detected_items_data, indent=2)}

        Task:
        1. Look at the original image and map it to the Computer Vision Data provided.
        2. Use the ImageCoveragePercentage and AverageDepthValue to estimate the physical volume and weight (in grams) of each DetectedIngredient.
        3. Calculate the estimated calories based on that weight.
        4. Calculate the TotalCalories.

        You MUST respond ONLY with a raw, valid JSON object matching this exact schema. Do not include markdown blocks (like ```json), explanations, or extra text:
        {{
            "Items": [
                {{
                    "Name": "Ingredient Name",
                    "EstimatedGrams": 150.0,
                    "Calories": 250.0
                }}
            ],
            "TotalCalories": 250.0
        }}
        """

        gemini_model = genai.GenerativeModel('gemini-2.5-flash')
        response = gemini_model.generate_content([prompt, original_image])

        # 5. Clean and parse the Gemini JSON response
        response_text = response.text.strip()
        # Regex to strip markdown code blocks if Gemini ignores instructions
        response_text = re.sub(r"```json\s*", "", response_text)
        response_text = re.sub(r"```\s*", "", response_text)

        final_json_result = json.loads(response_text)

        return final_json_result

    except Exception as e:
        print(f"Pipeline Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))