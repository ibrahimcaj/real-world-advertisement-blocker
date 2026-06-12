import os
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
    # resolve relative to this file so cwd doesn't matter
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "models", "bounding_best.pt")
    path = os.path.normpath(path)
    if not os.path.exists(path):
        print(f"model not found: {path}")
        return None, None
    from ultralytics import YOLO
    print(f"loading model: {path}")
    return YOLO(path), path

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

    # ultralytics returns normalized xyxy boxes directly
    results = model(img, verbose=False)[0]
    detections = []
    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxyn[0].tolist()
        detections.append({
            "box": [
                round(x1, 4), round(y1, 4),
                round(x2, 4), round(y2, 4),
            ],
            "class_id": int(box.cls[0]),
            "confidence": round(float(box.conf[0]), 3),
        })

    return {"detections": detections}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
