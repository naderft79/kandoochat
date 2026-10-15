import type { NextConfig } from "next";
import os from "os";

// IP های شبکه محلی را خودکار تشخیص می دهد تا گوشی روی همان وای فای بتواند به dev server وصل شود
const VIRTUAL_ADAPTER =
  /vethernet|vmware|virtualbox|wsl|hyper-v|loopback|bluetooth|zerotier|tailscale|hamachi|vpn|tun|tap/i;
const lanIps = Object.entries(os.networkInterfaces()).flatMap(([name, infos]) =>
  (infos ?? [])
    .filter((i) => i.family === "IPv4" && !i.internal && !VIRTUAL_ADAPTER.test(name))
    .map((i) => i.address)
);

const nextConfig: NextConfig = {
  reactCompiler: false,
  // IP های اضافی dev از DEV_LAN_ORIGINS (با کاما) — بدون IP هاردکد
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    ...(process.env.DEV_LAN_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? []),
    ...lanIps,
  ],
  devIndicators: false,
  serverExternalPackages: ["@prisma/client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    // در Next 16 عکس های لوکال با query string به طور پیش فرض رد می شوند؛
    // آپلودهای محلی با قالب /api/media?p=key سرو می شوند و باید مجاز باشند
    localPatterns: [
      { pathname: "/api/media" },
      { pathname: "**", search: "" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    // CSP فعلاً فقط گزارش می کند (Report-Only) — بعد از بررسی گزارش ها به حالت اجباری می رود
    const isDev = process.env.NODE_ENV !== "production";
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https: http:",
      "media-src 'self' blob: https: http:",
      "font-src 'self' data:",
      "connect-src 'self' https: http: ws: wss:",
      "frame-src 'self' https:",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https: http:",
      "frame-ancestors 'none'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy-Report-Only", value: csp },
          { key: "Permissions-Policy", value: "camera=(self), geolocation=(), microphone=(self)" },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
