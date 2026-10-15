# سرویس تشخیص چهره کندو — FastAPI + MediaPipe Tasks (BlazeFace)
# اجرا (توسعه): FACE_SERVICE_TOKEN=... uvicorn main:app --host 127.0.0.1 --port 8100
# سپس در .env کندو: FACE_DETECTOR_URL=http://127.0.0.1:8100 و همان FACE_SERVICE_TOKEN
# امنیت: بدون FACE_SERVICE_TOKEN سرویس بالا نمی آید؛ هر درخواست باید Bearer صحیح داشته باشد
import hmac
import os
from pathlib import Path

import cv2
import numpy as np
from fastapi import Depends, FastAPI, HTTPException, Request

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

# موتور اصلی: MediaPipe BlazeFace — اگر نصب نشده باشد به OpenCV Haar برمی گردیم
_mp_detector = None
try:
    import mediapipe as mp
    from mediapipe.tasks.python import vision

    _mp_detector = vision.FaceDetector.create_from_options(
        vision.FaceDetectorOptions(
            base_options=mp.tasks.BaseOptions(model_asset_path=MODEL_PATH),
            min_detection_confidence=0.5,
        )
    )
    print("[face-detector] engine: mediapipe/blazeface")
except Exception as _e:
    print(f"[face-detector] mediapipe unavailable ({_e}); falling back to opencv haar")

# یافتن فایل Haar — در نصب pip در cv2.data است و در پکیج های دبیان/اوبونتو در مسیرهای سیستمی
def _find_haarcascade() -> str:
    candidates = []
    if hasattr(cv2, "data") and getattr(cv2.data, "haarcascades", None):
        candidates.append(Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml")
    candidates += [
        Path("/usr/share/opencv4/haarcascades/haarcascade_frontalface_default.xml"),
        Path("/usr/share/opencv/haarcascades/haarcascade_frontalface_default.xml"),
        Path("/usr/local/share/opencv4/haarcascades/haarcascade_frontalface_default.xml"),
    ]
    for c in candidates:
        if c.exists():
            return str(c)
    raise RuntimeError("haarcascade_frontalface_default.xml not found")


_haar = None
if _mp_detector is None:
    _haar = cv2.CascadeClassifier(_find_haarcascade())
    print("[face-detector] engine: opencv haar")


def _detect(img_bgr) -> tuple[int, float]:
    """تعداد چهره و بهترین امتیاز را برمی گرداند."""
    if _mp_detector is not None:
        rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = _mp_detector.detect(mp_image)
        if not result.detections:
            return 0, 0.0
        scores = [d.categories[0].score for d in result.detections]
        return len(scores), float(max(scores))
    # haar فقط آستانه تعداد دارد — امتیاز را ۱ گزارش می کنیم
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    faces = _haar.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
    return len(faces), 1.0 if len(faces) else 0.0


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
async def detect(request: Request):
    # تصویر به صورت خام در بدنه درخواست می آید (بدون multipart)
    data = await request.body()
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="image too large")
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="empty image")
    arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return {"faces": 0, "score": 0.0}

    faces, score = _detect(img)
    return {"faces": faces, "score": score}
