// پلن های اشتراک — فقط بر اساس مدت زمان؛ سطح (پایه/پرمیوم/VIP) نداریم
export type SubscriptionPlan = {
  key: string;
  name: string;
  months: number | null; // null = مادام العمر
  coins: number;
  toman: number;
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { key: "1m", name: "۱ ماهه", months: 1, coins: 40, toman: 398_000 },
  { key: "3m", name: "۳ ماهه", months: 3, coins: 70, toman: 698_000 },
  { key: "6m", name: "۶ ماهه", months: 6, coins: 130, toman: 1_280_000 },
  { key: "lifetime", name: "مادام العمر", months: null, coins: 600, toman: 5_980_000 },
];

export function getPlan(key: string | null | undefined): SubscriptionPlan | null {
  return SUBSCRIPTION_PLANS.find((p) => p.key === key) ?? null;
}

// پایان اشتراک از روی تاریخ شروع — مادام العمر ۱۰۰ سال
export function planEndsAt(startsAt: Date, plan: SubscriptionPlan): Date {
  const days = plan.months === null ? 100 * 365 : plan.months * 30;
  return new Date(startsAt.getTime() + days * 24 * 60 * 60 * 1000);
}
