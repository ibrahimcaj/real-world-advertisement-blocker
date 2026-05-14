from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# allow next.js dev server to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

def load_model():
    from ultralytics import YOLO
    return YOLO("models/best.pt"), "models/best.pt"

model, model_path = load_model()
