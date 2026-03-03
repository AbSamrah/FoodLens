# FoodLens: AI-Powered Calorie Estimation System

FoodLens is a full-stack, distributed system designed to provide accurate nutritional analysis of meals using computer vision and large language models. The project bridges the gap between raw visual data and nutritional insights through a multi-stage AI pipeline.

## System Architecture

The system is built on SOLID principles and follows a decoupled microservice architecture:

- **Frontend**: Built with React Native (Expo), featuring a custom authentication flow and camera integration.
- **Main Backend**: Developed with ASP.NET Core, handling user management, SQL data persistence, and orchestration.
- **AI Microservice**: A FastAPI service running on Google Colab (GPU accelerated), hosting deep learning models for segmentation, depth estimation, and zero-shot classification.

## The AI Pipeline

FoodLens employs a "Vision-to-Reasoning" pipeline to ensure accuracy beyond simple 2D image recognition:

- **Semantic Segmentation**: Uses Segformer to identify and isolate individual food items within a single plate.
- **Monocular Depth Estimation**: Uses Depth-Anything-V2 to calculate spatial depth, providing the system with a 3D understanding of food volume.
- **Zero-Shot Classification**: Utilizes OpenAI CLIP to identify specific ingredients based on a dynamic list seeded from TheMealDB API.
- **Nutritional Reasoning**: Passes isolated visual segments and mathematical spatial data to Google Gemini 2.5 Flash for final volume-to-weight estimation and calorie calculation.

## Technical Stack

### Backend (ASP.NET Core)

- **Identity & Security**: ASP.NET Identity with JWT (JSON Web Token) authentication.
- **Data Access**: Entity Framework Core using the Repository Pattern for high testability and decoupling.
- **Database**: SQL Server for user profiles, ingredient types, and historical food logs.
- **Integration**: Typed HttpClient with delegation handlers for communicating with the AI microservice.

### Frontend (React Native)

- **Navigation**: React Navigation with protected stacks based on authentication state.
- **State Management**: React Context API for global authentication and user session handling.
- **Hardware Integration**: expo-camera and expo-image-picker for image acquisition.

### AI Service (Python/FastAPI)

- **Framework**: FastAPI with Uvicorn.
- **ML Libraries**: PyTorch, Transformers (HuggingFace), OpenCV, and NumPy.
- **Tunneling**: Ngrok for secure, real-time exposure of the Colab-hosted GPU environment.

## Features

- **Automated Ingredient Seeding**: Automatically populates the database with hundreds of ingredients from TheMealDB API on first run.
- **Spatial Awareness**: Uses depth maps to help the AI distinguish between a large portion and a close-up photo.
- **Historical Logging**: Users can track their nutritional intake over time with persistent storage.
- **Cross-Origin Support**: Fully configured CORS policy for seamless communication between web/mobile and the API.

## Project Structure

- **Backend/**: ASP.NET Core solution (Controllers, Repositories, Interfaces, Entities).
- **Frontend/**: Expo project (Screens, Context, API services).
- **AI-Service/**: Python FastAPI implementation and model configuration.

## Installation & Setup

### Backend

1. Configure the `DefaultConnection` string in `appsettings.json`.
2. Run `dotnet ef database update` to apply migrations.
3. Update the `VisionApiService` base address with your active AI service URL.

### Frontend

1. Navigate to the Frontend folder.
2. Run `npm install`.
3. Execute `npx expo start` to launch the Metro bundler.

### AI Service

1. Load the `main.py` script into a Google Colab notebook with a T4 GPU.
2. Install dependencies: `pip install fastapi uvicorn pyngrok google-generativeai transformers`.
3. Launch the server and copy the provided Ngrok URL to the backend configuration.

---

Developed by Ammar Samrah
