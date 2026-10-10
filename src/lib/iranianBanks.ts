// دیتای پیش شماره کارت بانک های ایران
// پیش شماره 6 رقمی اول کارت برای تشخیص بانک استفاده می شود
import { getBankInfoWithCardNumber } from "ir-banks-info";

export type BankInfo = {
  prefix: string;
  name: string;
  color: string;
  logo?: string;
};

export const IRANIAN_BANKS: BankInfo[] = [
  { prefix: "603799", name: "بانک ملی", color: "#16a34a" },
  { prefix: "589210", name: "بانک سپه", color: "#dc2626" },
  { prefix: "627648", name: "بانک صادرات", color: "#2563eb" },
  { prefix: "639607", name: "بانک کشاورزی", color: "#16a34a" },
  { prefix: "627381", name: "بانک مسکن", color: "#f59e0b" },
  { prefix: "505785", name: "بانک توسعه تعاون", color: "#7c3aed" },
  { prefix: "622106", name: "بانک صنعت و معدن", color: "#0891b2" },
  { prefix: "504172", name: "پست بانک", color: "#f59e0b" },
  { prefix: "639346", name: "بانک توسعه صادرات", color: "#1d4ed8" },
  { prefix: "628023", name: "بانک ملت", color: "#b45309" },
  { prefix: "627760", name: "بانک تجارت", color: "#0ea5e9" },
  { prefix: "502910", name: "بانک پاسارگاد", color: "#16a34a" },
  { prefix: "603770", name: "بانک سرمایه", color: "#1e293b" },
  { prefix: "639370", name: "بانک اقتصاد نوین", color: "#7c3aed" },
  { prefix: "627412", name: "بانک تعاون", color: "#0891b2" },
  { prefix: "622197", name: "بانک صادرات ایران", color: "#2563eb" },
  { prefix: "621346", name: "بانک شهر", color: "#dc2626" },
  { prefix: "639347", name: "بانک خاورمیانه", color: "#f59e0b" },
  { prefix: "639609", name: "بانک انصار", color: "#16a34a" },
  { prefix: "636214", name: "بانک گردشگری", color: "#0ea5e9" },
  { prefix: "505801", name: "بانک حکمت ایرانیان", color: "#7c3aed" },
  { prefix: "636949", name: "بانک رسالت", color: "#dc2626" },
  { prefix: "505429", name: "بانک مهر ایران", color: "#f59e0b" },
  { prefix: "606256", name: "بانک مهر اقتصاد", color: "#0891b2" },
  { prefix: "636795", name: "بانک مرکزی", color: "#1e293b" },
  { prefix: "585983", name: "بانک خاورمیانه", color: "#f59e0b" },
  { prefix: "639599", name: "بانک قوامین", color: "#16a34a" },
  { prefix: "589463", name: "بانک سپه", color: "#dc2626" },
  { prefix: "627353", name: "بانک شهر", color: "#dc2626" },
  { prefix: "502229", name: "بانک پاسارگاد", color: "#16a34a" },
  { prefix: "207177", name: "بانک انصار", color: "#16a34a" },
  { prefix: "636793", name: "بانک گردشگری", color: "#0ea5e9" },
  { prefix: "621320", name: "بانک شهر", color: "#dc2626" },
  { prefix: "603769", name: "بانک سرمایه", color: "#1e293b" },
];

// تشخیص بانک از شماره کارت
export function detectBank(cardNumber: string): BankInfo | null {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 6) return null;

  // ابتدا با استفاده از پکیج ir-banks-info
  try {
    const info = getBankInfoWithCardNumber(digits.substring(0, 6));
    if (info && info.name) {
      return {
        prefix: digits.substring(0, 6),
        name: info.name,
        color: "#2563eb",
        logo: info.logo,
      };
    }
  } catch {
    // fallback به دیتای دستی
  }

  const prefix6 = digits.substring(0, 6);
  const prefix4 = digits.substring(0, 4);

  let bank = IRANIAN_BANKS.find((b) => b.prefix === prefix6);
  if (bank) return bank;

  bank = IRANIAN_BANKS.find((b) => b.prefix.startsWith(prefix4) && b.prefix.length >= 4);
  return bank ?? null;
}

// فرمت شماره کارت — هر 4 رقم با فاصله
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").substring(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}
