import glob
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

def load_model():
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
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    results = model(img, verbose=False)[0]
    detections = []
    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxyn[0].tolist()
        detections.append({
            "box": [round(x1,4), round(y1,4), round(x2,4), round(y2,4)],
            "class_id": int(box.cls[0]),
            "confidence": round(float(box.conf[0]), 3),
        })

    return {"detections": detections}
