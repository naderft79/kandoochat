// صفحه حالت تعمیر سایت
import { getAllSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const settings = await getAllSettings();

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-6">
      <div className="lux-card p-8 max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl lux-btn-gold flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.296 1.077-.596 1.528-.848m-6.665 1.083c.55-.296 1.077-.596 1.528-.848m-1.528.848l-.001-.001m6.665 1.083l.001.001m-6.665-1.083l6.665 1.083" />
          </svg>
        </div>
        <h1 className="text-lg font-black text-foreground mb-2">حالت تعمیر</h1>
        <p className="text-sm text-ig-gray leading-relaxed">{settings.maintenanceMessage}</p>
      </div>
    </div>
  );
}
