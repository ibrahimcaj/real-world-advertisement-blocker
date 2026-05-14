import glob
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
    # ultralytics handles .pt natively including nms and postprocessing
    matches = glob.glob("models/*.pt")
    if matches:
        from ultralytics import YOLO
        path = matches[0]
        print(f"loading model: {path}")
        return YOLO(path), path
    return None, None

model, model_path = load_model()
