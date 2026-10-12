# راهنمای Deploy روی VPS (بدون Docker)

## پیش نیازها روی سرور

- Ubuntu 22.04+
- Node.js 22 LTS (`nvm install 22`)
- PostgreSQL 15+
- Redis 6+
- Nginx + Certbot (TLS)
- PM2 (`npm i -g pm2`)

## متغیرهای محیطی

فایل `.env` را طبق `docs/environment.md` پر کنید. موارد حیاتی:

```
DATABASE_URL=postgresql://kandoo:PASS@127.0.0.1:5432/kandoo
JWT_SECRET=<64+ chars random>
NEXT_PUBLIC_BASE_URL=https://kandoo.ir
KANDOO_PUBLIC_URL=https://kandoo.ir
KANDOOPAY_URL=https://kandoopay.com
KANDOOPAY_SHARED_SECRET=<مشترک با کندوپی، حداقل ۳۲ کاراکتر>
REDIS_URL=redis://127.0.0.1:6379
SABANOVIN_API_KEY=...
SABANOVIN_GATEWAY=...
FACE_DETECTOR_URL=http://127.0.0.1:8100
FACE_SERVICE_TOKEN=<64+ chars random>
CRON_SECRET=<64+ chars random>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@kandoo.ir
S3_ENDPOINT=...
S3_BUCKET=...
S3_REGION=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_URL=https://cdn.kandoo.ir
CRON_SECRET=<random>
FACE_DETECTOR_URL=http://127.0.0.1:8000  # اختیاری — سرویس محلی تشخیص چهره
PG_POOL_MAX=50                          # حداکثر اتصال همزمان هر instance به Postgres
```

## تنظیمات PostgreSQL برای بار بالا (مهم)

پیش فرض `max_connections = 100` است که زیر بار همزمان با خطای `too many clients already` / `P2028` مواجه می شود. در `postgresql.conf`:

```
max_connections = 300
```

و سرور را restart کنید. رابطه درست: `(PG_POOL_MAX × تعداد instance های اپ) + ۲۰ اتصال اضافه برای ابزارها <= max_connections`

## مراحل دیپلوی

```bash
git clone <repo> /var/www/kandoo && cd /var/www/kandoo
npm ci
npx prisma migrate deploy
npx tsx prisma/seed-missions.ts   # ماموریت های پیش فرض (یک بار)
npm run build:pwa                 # تولید آیکون ها + بیلد
pm2 start npm --name kandoo -- start
pm2 save && pm2 startup
```

## Nginx

```nginx
server {
  listen 443 ssl http2;
  server_name kandoo.ir;
  client_max_body_size 60m;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Upgrade $http_upgrade;   # SSE/WS
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 300s;                  # SSE stream
  }
}
```

## بکاپ دیتابیس (کرون روزانه)

```bash
chmod +x scripts/backup-db.sh
crontab -e
# 0 3 * * * /var/www/kandoo/scripts/backup-db.sh >> /var/log/kandoo-backup.log 2>&1
```

بکاپ ها در `backups/` با نگهداری ۱۴ روز ذخیره می شوند.

## مانیتورینگ

- Health check: `GET /api/health` (وضعیت DB و Redis) — در UptimeRobot یا cron ثبت کنید.
- لاگ ها: `pm2 logs kandoo`

## نکته ها

- پوشه `public/uploads` فقط برای توسعه است؛ در production فایل ها به S3 می روند.
- چت real-time روی SSE تک‌پروسسه است؛ اگر چند instance اجرا کنید (`pm2 -i max`) باید Redis pub/sub برای `chatEvents` اضافه شود.
- APK: `npm run build:apk` (روی سیستم با Android SDK).
- PWA: `npm run build:pwa`.
