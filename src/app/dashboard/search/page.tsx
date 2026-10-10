// لیست پروفایل ها: سبک Explore اینستاگرام — گرید مربعی ۳ ستونی
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDiscoveryPage } from "@/lib/discovery";
import MatchesClient, { type Match } from "@/components/dashboard/MatchesClient";

type MatchDto = Omit<Match, "lastSeen" | "createdAt"> & { lastSeen: Date; createdAt: Date };

export default async function MatchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // صفحه اول نتایج (همان کوئری مشترک با /api/matches تا نتیجه یکسان باشد)
  const { matches, totalPages } = await getDiscoveryPage(user, new URLSearchParams(), 1);

  return (
    <MatchesClient
      currentCity={user.city}
      currentProvince={user.province}
      initialMatches={(matches as MatchDto[]).map((m) => ({
        ...m,
        lastSeen: m.lastSeen.toISOString(),
        createdAt: m.createdAt.toISOString(),
      }))}
      initialTotalPages={totalPages}
    />
  );
}
