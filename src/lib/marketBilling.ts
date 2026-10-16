// پل جاوااسکریپت پرداخت درون برنامه ای مارکت ها (کافه بازار / مایکت)
// پلاگین نیتیو «MarketBilling» در هر خروجی مارکتی پیاده سازی شده است
import { registerPlugin, Capacitor } from "@capacitor/core";
import { isMarketAppClient } from "@/lib/app-ua";

// نتیجه خرید نیتیو — همه فیلدها به سرور برای تایید امضا و اعتبار فرستاده می شوند
export type MarketPurchase = {
  productId: string;
  purchaseToken: string;
  orderId?: string;
  packageName?: string;
  signedData?: string;
  signature?: string;
};

type MarketBillingPluginType = {
  purchase(options: { productId: string }): Promise<MarketPurchase>;
  isReady(): Promise<{ ready: boolean }>;
  consumePurchase(options: { purchaseToken: string }): Promise<void>;
};

const MarketBilling = registerPlugin<MarketBillingPluginType>("MarketBilling");

// آیا پرداخت درون برنامه ای مارکت در این محیط در دسترس است؟
export function isMarketBillingAvailable(): boolean {
  return Capacitor.isNativePlatform() && isMarketAppClient();
}

// شروع خرید یک محصول — شناسه محصول مثل «coins_50» یا «sub_3m»
export async function purchaseProduct(productId: string): Promise<MarketPurchase> {
  return MarketBilling.purchase({ productId });
}

// مصرف خرید سکه بعد از تایید سرور — بدون مصرف، خرید مجدد همان محصول خطا می دهد
export async function consumePurchase(purchaseToken: string): Promise<void> {
  try {
    await MarketBilling.consumePurchase({ purchaseToken });
  } catch {
    // خطای مصرف را نادیده می گیریم — سکه قبلا واریز شده و خرید بعدا قابل مصرف است
  }
}
