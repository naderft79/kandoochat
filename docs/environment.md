# متغیرهای محیطی کندو

این فایل لیست متغیرهای لازم برای اجرای کندو در production است. مقادیر واقعی را در فایل `.env` ریشه پروژه قرار دهید و هرگز commit نکنید (`.env*` در `.gitignore` قرار دارد).

## ضروری

| نام | توضیح | مثال |
|---|---|---|
| `DATABASE_URL` | رشته اتصال PostgreSQL | `postgresql://kandoo:pass@localhost:5432/kandoo?schema=public` |
| `JWT_SECRET` | رمز امضای JWT (حداقل ۶۴ کاراکتر رندوم) | — |
| `NEXT_PUBLIC_BASE_URL` | دامنه عمومی سایت | `https://kandoochat.com` |
| `KANDOO_PUBLIC_URL` | دامنه سمت سرور | `https://kandoochat.com` |
| `KANDOOPAY_URL` | آدرس KandooPay | `https://kandoopay.com` |
| `KANDOOPAY_SHARED_SECRET` | کلید مخفی مشترک امضای توکن پرداخت | — |
| `REDIS_URL` | آدرس Redis | `redis://localhost:6379` |
| `CRON_SECRET` | توکن محرمانه cron job | — |

## SMS / OTP

| نام | توضیح |
|---|---|
| `SABANOVIN_API_KEY` | کلید API وب سرویس صبانوین (از بخش وب سرویس پنل صبانوین) |
| `SABANOVIN_GATEWAY` | شماره خط ارسال (درگاه) صبانوین؛ کد تایید با متد OTP همین خط ارسال می شود |

## AI همراه

| نام | توضیح |
|---|---|
| `KIRA_API_KEY` | کلید API مدل همراه هوش مصنوعی |
| `KIRA_API_URL` | endpoint API (اختیاری، پیش‌فرض `https://kiraai.vn/api/v1/chat/completions`) |

## تشخیص چهره

| نام | توضیح |
|---|---|
| `FACE_DETECTOR_URL` | آدرس سرویس محلی تشخیص چهره (مثلاً `http://127.0.0.1:8100`) — endpoint `POST /detect` با multipart `image` و پاسخ `{ faces, score }` |
| `FACE_SERVICE_TOKEN` | توکن مشترک Bearer بین کندو و سرویس چهره (حداقل ۳۲ کاراکتر)؛ بدون آن سرویس اجرا نمی شود |

سرویس آماده در `scripts/face-detector/` قرار دارد (FastAPI + MediaPipe BlazeFace):

```bash
pip install -r scripts/face-detector/requirements.txt
FACE_SERVICE_TOKEN=<همان مقدار .env> python -m uvicorn main:app --host 127.0.0.1 --port 8100  # از داخل پوشه scripts/face-detector
```

اگر این متغیر تنظیم نشود یا سرویس در دسترس نباشد، درخواست ها به بررسی دستی ادمین می افتند (AUTO_RESULT = NEEDS_MANUAL_REVIEW).

## Push Notification

| نام | توضیح |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | کلید عمومی VAPID |
| `VAPID_PRIVATE_KEY` | کلید خصوصی VAPID |
| `VAPID_SUBJECT` | آدرس تماس، مثلاً `mailto:admin@kandoochat.com` |

## Object Storage (S3-compatible)

| نام | توضیح |
|---|---|
| `S3_ENDPOINT` | آدرس endpoint |
| `S3_BUCKET` | نام bucket |
| `S3_REGION` | region |
| `S3_ACCESS_KEY_ID` | access key |
| `S3_SECRET_ACCESS_KEY` | secret key |
| `S3_PUBLIC_URL` | URL عمومی CDN |

## نکات

- برای توسعه محلی می توانید از `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kandoo?schema=public"` استفاده کنید.
- از یک generator برای `JWT_SECRET` و `KANDOOPAY_SHARED_SECRET` استفاده کنید (مثلاً `openssl rand -hex 64`).
- برای تولید کلیدهای VAPID از `npx web-push generate-vapid-keys` استفاده کنید و کلیدها را در `.env` قرار دهید.
- در محیط توسعه بدون `SABANOVIN_API_KEY`، کد OTP فقط در لاگ سرور چاپ می شود و پیامکی ارسال نمی شود.
