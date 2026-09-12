import io
import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from PIL import Image
from ultralytics import YOLO

app = FastAPI(title="Pothole Detection AI Service")

BASE_DIR = Path(__file__).parent
MODEL_PATH = BASE_DIR / "models" / "yolov8n_pothole.pt"

print(f"Loading YOLOv8 Pothole model from: {MODEL_PATH}")
model = YOLO(str(MODEL_PATH))

@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_PATH.name}

@app.post("/detect")
@app.post("/models/{model_name:path}")
async def detect(request: Request):
    content_type = request.headers.get("content-type", "")
    
    if "multipart/form-data" in content_type:
        form = await request.form()
        file_obj = form.get("file")
        if not file_obj:
            return JSONResponse(status_code=400, content={"message": "No file uploaded"})
        image_bytes = await file_obj.read()
    else:
        image_bytes = await request.body()
    
    if not image_bytes:
        return JSONResponse(status_code=400, content={"message": "Empty image payload"})
    
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        return JSONResponse(status_code=400, content={"message": f"Invalid image: {e}"})
    
    # Run YOLOv8 pothole inference
    results = model(image, conf=0.20)
    
    predictions = []
    for r in results:
        boxes = r.boxes
        for box in boxes:
            cls_id = int(box.cls[0].item())
            class_name = model.names.get(cls_id, "pothole")
            confidence = float(box.conf[0].item())
            xyxy = box.xyxy[0].tolist()
            
            predictions.append({
                "label": class_name,
                "score": round(confidence, 4),
                "box": {
                    "xmin": round(xyxy[0], 2),
                    "ymin": round(xyxy[1], 2),
                    "xmax": round(xyxy[2], 2),
                    "ymax": round(xyxy[3], 2),
                }
            })
            
    # Fallback if no detections meet strict threshold but model sees road defect
    if not predictions and len(results) > 0:
        # Run with lower threshold to inspect
        low_res = model(image, conf=0.05)
        for r in low_res:
            for box in r.boxes:
                cls_id = int(box.cls[0].item())
                class_name = model.names.get(cls_id, "pothole")
                confidence = float(box.conf[0].item())
                xyxy = box.xyxy[0].tolist()
                predictions.append({
                    "label": class_name,
                    "score": round(confidence, 4),
                    "box": {
                        "xmin": round(xyxy[0], 2),
                        "ymin": round(xyxy[1], 2),
                        "xmax": round(xyxy[2], 2),
                        "ymax": round(xyxy[3], 2),
                    }
                })
    
    return JSONResponse(content=predictions)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=5001, reload=False)
