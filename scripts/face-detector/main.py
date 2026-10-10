# سرویس تشخیص چهره کندو — FastAPI + MediaPipe Tasks (BlazeFace)
# اجرا: uvicorn main:app --host 127.0.0.1 --port 8100
# سپس در .env کندو: FACE_DETECTOR_URL=http://127.0.0.1:8100
from pathlib import Path
from fastapi import FastAPI, File, UploadFile
import mediapipe as mp
from mediapipe.tasks.python import vision
import numpy as np
import cv2

MODEL_PATH = str(Path(__file__).parent / "blaze_face_short_range.tflite")

app = FastAPI()
detector = vision.FaceDetector.create_from_options(
    vision.FaceDetectorOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=MODEL_PATH),
        min_detection_confidence=0.5,
    )
)


@app.post("/detect")
async def detect(image: UploadFile = File(...)):
    data = await image.read()
    arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return {"faces": 0, "score": 0.0}

    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result = detector.detect(mp_image)

    if not result.detections:
        return {"faces": 0, "score": 0.0}

    scores = [d.categories[0].score for d in result.detections]
    return {"faces": len(scores), "score": float(max(scores))}
