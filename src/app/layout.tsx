import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "کندو | سایت همسریابی",
    template: "%s | کندو",
  },
  description:
    "کندو، جایی برای پیدا کردن نیمه گمشده شما. با پروفایل های تایید شده و امنیت بالا.",
  keywords: ["همسریابی", "کندو", "آشنایی", "ازدواج", "پروفایل تایید شده", "سایت همسریابی"],
  authors: [{ name: "Kandoo" }],
  creator: "Kandoo",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    title: "کندو | سایت همسریابی",
    description: "کندو، جایی برای پیدا کردن نیمه گمشده شما. با پروفایل های تایید شده و امنیت بالا.",
    siteName: "کندو",
    images: [{ url: "/bee-colori-logo.png", width: 512, height: 512, alt: "کندو" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "کندو | سایت همسریابی",
    description: "کندو، جایی برای پیدا کردن نیمه گمشده شما.",
    images: ["/bee-colori-logo.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "کندو",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "کندو",
    "application-name": "کندو",
    "format-detection": "telephone=no",
  },
};

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // با باز شدن کیبورد، viewport لی اوت کوچک می شود تا هدر و باکس تایپ چت دیده شوند
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // فقط برای کاربران وارد شده — اعلان زنده باید در همه صفحات کار کند
  const session = await getSession();

  return (
    <html
      lang="fa"
      dir="rtl"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${vazirmatn.variable} ${grandHotel.variable} h-full antialiased`}
    >
      <head />
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
