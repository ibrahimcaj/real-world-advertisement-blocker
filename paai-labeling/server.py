import glob
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import io

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

@app.get("/status")
def status():
    return {"loaded": model is not None, "model": model_path}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        return JSONResponse({"error": "no model loaded"}, status_code=503)
    img_bytes = await file.read()
    img = Image.open(io.BytesIO(img_bytes))
    results = model(img, verbose=False)[0]
    return {"detections": []}
