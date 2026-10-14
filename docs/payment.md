# اتصال پرداخت کندو به KandooPay

## معماری فعلی

1. کاربر در کندو روی «خرید سکه» یا «خرید اشتراک» کلیک می‌کند.
2. `POST /api/payment/create` یک `PaymentRequest` با `status=PENDING` می‌سازد و یک توکن امضاشده (JWS، الگوریتم `HS512`) تولید می‌کند.
3. کاربر به `https://kandoopay.com/checkout/kandoo?token=<token>&title=...&amount=...&type=...&returnPath=...` هدایت می‌شود.
4. کاربر در KandooPay پرداخت را انجام می‌دهد.
5. بعد از پرداخت، KandooPay باید کاربر را به کال‌بک کندو برگرداند:
   ```
   https://kandoochat.top/api/payment/callback?token=<token>&status=success&refId=<refId>
   ```
   برای پرداخت ناموفق:
   ```
   https://kandoochat.top/api/payment/callback?token=<token>&status=failed
   ```
   یا `status=canceled` برای انصراف.
6. کال‌بک کندو توکن را تایید می‌کند، مبلغ/نوع/کاربر را مطابقت می‌دهد و در صورت `success` سکه یا اشتراک را به صورت idempotent اعطا می‌کند.

## توکن امضاشده

- با کلید `KANDOOPAY_SHARED_SECRET` امضا می‌شود.
- payload شامل `paymentId`، `userId`، `type`، `coins`، `amountToman`، `returnPath` است.
- اعتبار ۳۰ دقیقه است.
- هم در callback و هم در webhook از `verifyPaymentToken` استفاده می‌شود.

## Endpointها

- `POST /api/payment/create` — ایجاد درخواست و بازگرداندن `redirectUrl`.
- `GET /api/payment/callback` — بازگشت کاربر؛ تایید توکن و اعطای سکه/اشتراک.
- `POST /api/payment/webhook` — کال‌بک server-to-server (اختیاری، برای پشتیبانی در صورت قطع شدن مرورگر کاربر).
- `GET /api/payment/status?paymentId=...` — وضعیت پرداخت کاربر (برای polling).

## Idempotency

- تسویه فقط روی `PaymentRequest.status === "PENDING"` انجام می‌شود.
- در یک transaction اتمیک، status به `PAID` تغییر می‌کند و تراکنش ثبت می‌شود.
- callback دوم با `already` برمی‌گردد و دوباره سکه/اشتراک نمی‌دهد.

## متغیرهای محیطی

- `KANDOOPAY_URL` — آدرس KandooPay (پیش‌فرض `https://kandoopay.com`)
- `KANDOOPAY_SHARED_SECRET` — کلید ۳۲+ کاراکتری برای امضای توکن
- `KANDOO_PUBLIC_URL` — دامنه عمومی کندو برای callback redirect (مثل `https://kandoochat.top`)

## نیازمندی KandooPay (بدون تغییر کد)

KandooPay باید بعد از تایید پرداخت، کاربر را به `https://kandoochat.top/api/payment/callback?token=<token>&status=<status>&refId=<refId>` redirect کند.
اگر KandooPay این قابلیت را فعلا ندارد، باید در deploy تنظیم شود (مثلاً با proxy یا تنظیم callback URL در پنل درگاه).
در غیر این صورت کاربر بعد از پرداخت روی صفحه نتیجه فاکتور KandooPay می‌ماند و کندو می‌تواند از `/api/payment/status` برای polling وضعیت استفاده کند.
