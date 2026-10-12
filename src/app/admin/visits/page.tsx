// صفحه آمار بازدید پنل ادمین: ورودی های موتور جستجو و شبکه های اجتماعی و بازدید هر صفحه
import VisitsDashboard from "@/components/admin/VisitsDashboard";

export const dynamic = "force-dynamic";

export default function AdminVisitsPage() {
  return (
    <div className="pb-6">
      <h1 className="text-xl font-black text-foreground">آمار بازدید</h1>
      <p className="text-xs text-[#888] mt-1">
        ورودی های موتور جستجو و شبکه های اجتماعی و بازدید هر صفحه سایت؛ بازدید مدیران در این آمار شمرده نمی شود.
      </p>
      <VisitsDashboard />
    </div>
  );
}
