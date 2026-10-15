# سرویس تشخیص چهره کندو — FastAPI + MediaPipe Tasks (BlazeFace)
# اجرا (توسعه): FACE_SERVICE_TOKEN=... uvicorn main:app --host 127.0.0.1 --port 8100
# سپس در .env کندو: FACE_DETECTOR_URL=http://127.0.0.1:8100 و همان FACE_SERVICE_TOKEN
# امنیت: بدون FACE_SERVICE_TOKEN سرویس بالا نمی آید؛ هر درخواست باید Bearer صحیح داشته باشد
import hmac
import os
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from mediapipe.tasks.python import vision

# خواندن FACE_SERVICE_TOKEN از فایل .env کنار اسکریپت (بدون وابستگی اضافه)
_env_file = Path(__file__).parent / ".env"
if _env_file.exists():
    for _line in _env_file.read_text().splitlines():
        _line = _line.strip()
        if _line and "=" in _line and not _line.startswith("#"):
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

MODEL_PATH = str(Path(__file__).parent / "blaze_face_short_range.tflite")
MAX_IMAGE_BYTES = 10 * 1024 * 1024
SERVICE_TOKEN = os.environ.get("FACE_SERVICE_TOKEN", "")

if len(SERVICE_TOKEN) < 32:
    raise RuntimeError("FACE_SERVICE_TOKEN must be set (at least 32 chars)")

app = FastAPI()
detector = vision.FaceDetector.create_from_options(
    vision.FaceDetectorOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=MODEL_PATH),
        min_detection_confidence=0.5,
    )
)


async def require_token(request: Request) -> None:
    header = request.headers.get("authorization", "")
    expected = f"Bearer {SERVICE_TOKEN}"
    # مقایسه ثابت-زمان برای جلوگیری از حمله زمان بندی
    if not hmac.compare_digest(header.encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="unauthorized")


@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/detect", dependencies=[Depends(require_token)])
async def detect(image: UploadFile = File(...)):
    data = await image.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="image too large")
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
