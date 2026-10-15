// PM2 — سرویس تشخیص چهره کندو
// اجرا: cd scripts/face-detector && pm2 start ecosystem.config.cjs && pm2 save
// توکن از scripts/face-detector/.env خوانده می شود (FACE_SERVICE_TOKEN=...)
module.exports = {
  apps: [
    {
      name: "kandoo-face",
      script: ".venv/bin/python",
      args: "-m uvicorn main:app --host 127.0.0.1 --port 8100",
      cwd: __dirname,
      autorestart: true,
      max_memory_restart: "600M",
    },
  ],
};
