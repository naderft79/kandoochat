// مانیفست PWA پویا بر اساس برند درخواست کننده — هر اپ مانیفست با نام، رنگ و آیکون خودش می گیرد
import { getRequestBrand } from "@/lib/brand-server";

export async function GET() {
  const brand = await getRequestBrand();
  const isKandoo = brand.id === "kandoo";
  const icon = (size: number, purpose?: string) => ({
    src: isKandoo ? `/icons/icon-${size}.png` : `/api/brand-icon/${size}`,
    sizes: `${size}x${size}`,
    type: "image/png",
    ...(purpose ? { purpose } : {}),
  });

  const manifest = {
    id: isKandoo ? "/" : `/?brand=${brand.id}`,
    name: `${brand.name} | ${brand.slogan}`,
    short_name: brand.name,
    description: `${brand.name}، جایی برای پیدا کردن نیمه گمشده شما`,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: isKandoo ? "#ffffff" : brand.colors.primary,
    dir: "rtl",
    lang: "fa",
    categories: ["social", "lifestyle"],
    handle_links: "preferred",
    launch_handler: { client_mode: "focus-existing" },
    prefer_related_applications: false,
    icons: [
      icon(192),
      icon(512),
      ...(isKandoo
        ? [
            {
              src: "/icons/maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ]
        : []),
    ],
    shortcuts: [
      { name: "گفتگوها", short_name: "چت", url: "/dashboard/chat", icons: [icon(192)] },
      { name: "جستجوی کاربران", short_name: "جستجو", url: "/dashboard/search", icons: [icon(192)] },
      { name: "کیف پول", short_name: "کیف پول", url: "/dashboard/coins", icons: [icon(192)] },
    ],
    screenshots: [
      {
        src: "/screenshots/mobile.png",
        sizes: "1080x2400",
        type: "image/png",
        form_factor: "narrow",
        label: `${brand.name} — ${brand.slogan}`,
      },
      {
        src: "/screenshots/desktop.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
        label: `${brand.name} — ${brand.slogan}`,
      },
    ],
  };

  return Response.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      // مانیفست بر اساس UA فرق می کند — کش فقط برای همان UA
      "Cache-Control": "private, max-age=3600",
      Vary: "User-Agent",
    },
  });
}
