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
  allowedDevOrigins: ["localhost", "127.0.0.1", "0.0.0.0", ...lanIps],
  devIndicators: false,
  serverExternalPackages: ["@prisma/client"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
