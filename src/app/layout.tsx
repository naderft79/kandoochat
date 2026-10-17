import type { Metadata, Viewport } from "next";
import { getRequestBrandInfo } from "@/lib/brand-server";
import { getBrandTheme, brandCssVars, brandDarkCss } from "@/lib/brand-theme";
import BrandProvider from "@/components/BrandProvider";
import { Vazirmatn, Grand_Hotel } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import InstallBanner from "@/components/pwa/InstallBanner";
import AndroidBackHandler from "@/components/AndroidBackHandler";
import PortraitGuard from "@/components/PortraitGuard";
import ZoomGuard from "@/components/ZoomGuard";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import PageViewTracker from "@/components/analytics/PageViewTracker";
import LiveDataProvider from "@/components/dashboard/LiveDataProvider";
import { getSession } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
});

const grandHotel = Grand_Hotel({
  variable: "--font-grand-hotel",
  subsets: ["latin"],
  weight: ["400"],
});

// metadata پویا بر اساس برند تشخیص داده شده از User-Agent — اپ های مارکتی نام خودشان را می بینند
export async function generateMetadata(): Promise<Metadata> {
  const { brand } = await getRequestBrandInfo();
  const n = brand.name;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${n} | سایت ${brand.slogan}`,
      template: `%s | ${n}`,
    },
    description: `${n}، جایی برای پیدا کردن نیمه گمشده شما. با پروفایل های تایید شده و امنیت بالا.`,
    keywords: ["همسریابی", n, "آشنایی", "ازدواج", "پروفایل تایید شده", "سایت همسریابی"],
    authors: [{ name: n }],
    creator: n,
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: "/api/brand-icon/192", sizes: "192x192", type: "image/png" },
        { url: "/api/brand-icon/512", sizes: "512x512", type: "image/png" },
      ],
      apple: "/api/brand-icon/180",
    },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      title: `${n} | سایت ${brand.slogan}`,
      description: `${n}، جایی برای پیدا کردن نیمه گمشده شما. با پروفایل های تایید شده و امنیت بالا.`,
      siteName: n,
      images: [{ url: "/api/brand-icon/512", width: 512, height: 512, alt: n }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${n} | سایت ${brand.slogan}`,
      description: `${n}، جایی برای پیدا کردن نیمه گمشده شما.`,
      images: ["/api/brand-icon/512"],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: n,
    },
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "apple-mobile-web-app-title": n,
      "application-name": n,
      "format-detection": "telephone=no",
    },
  };
}

// theme-color هر برند رنگ خودش — نوار آدرس موبایل برنددار می شود
export async function generateViewport(): Promise<Viewport> {
  const { brand } = await getRequestBrandInfo();
  return {
    themeColor: brand.id === "kandoo" ? "#ffffff" : brand.colors.primary,
    width: "device-width",
    initialScale: 1,
    minimumScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    // با باز شدن کیبورد، viewport لی اوت کوچک می شود تا هدر و باکس تایپ چت دیده شوند
    interactiveWidget: "resizes-content",
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // فقط برای کاربران وارد شده — اعلان زنده باید در همه صفحات کار کند
  const session = await getSession();
  const { brand, market } = await getRequestBrandInfo();
  const theme = getBrandTheme(brand);
  // مجموعه کامل متغیرهای برند: پالت + شکل + سایه + گرادیانت — سمت سرور تزریق می شود (بدون فلیکر)
  const brandStyle = brandCssVars(brand, theme) as React.CSSProperties;
  // قواعد حالت تاریک برند — فقط برای برندهای غیرکندو
  const darkCss = brandDarkCss(brand);

  return (
    <html
      lang="fa"
      dir="rtl"
      data-scroll-behavior="smooth"
      data-brand={brand.id}
      data-theme={theme.id}
      suppressHydrationWarning
      style={brandStyle}
      className={`${vazirmatn.variable} ${grandHotel.variable} h-full antialiased`}
    >
      <head>{darkCss && <style dangerouslySetInnerHTML={{ __html: darkCss }} />}</head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <ThemeProvider>
          <BrandProvider brand={brand} market={market}>
          <ServiceWorkerRegister />
          <AndroidBackHandler />
          <PortraitGuard />
          <ZoomGuard />
          <ToastProvider>
            <LiveDataProvider enabled={!!session}>
              {children}
              <PageViewTracker />
            </LiveDataProvider>
          </ToastProvider>
          <InstallBanner />
          </BrandProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
