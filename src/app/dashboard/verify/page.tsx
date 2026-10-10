// صفحه احراز هویت — دو تب: تیک آبی و احراز هویت کامل (لازم برای برداشت)
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import PageHeader from "@/components/dashboard/PageHeader";
import CoinBadge from "@/components/dashboard/CoinBadge";
import VerifyClient from "@/components/dashboard/VerifyClient";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { tab } = await searchParams;

  // آخرین درخواست هر نوع برای نمایش وضعیت
  const [blueTick, kyc] = await Promise.all([
    prisma.verificationRequest.findFirst({
      where: { userId: user.id, kind: "BLUE_TICK" },
      orderBy: { createdAt: "desc" },
      select: { status: true },
    }),
    prisma.verificationRequest.findFirst({
      where: { userId: user.id, kind: "KYC" },
      orderBy: { createdAt: "desc" },
      select: { status: true },
    }),
  ]);

  return (
    <div>
      {/* هدر یکپارچه */}
      <PageHeader
        title="احراز هویت"
        icon={<ShieldCheck className="w-5 h-5 text-foreground" strokeWidth={1.8} />}
        left={<CoinBadge />}
      />

      <div className="max-w-[600px] mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-4">
        <VerifyClient
          initialTab={tab === "kyc" ? "kyc" : "bluetick"}
          isVerified={user.isVerified}
          blueTickStatus={blueTick?.status ?? null}
          isIdentityVerified={user.isIdentityVerified}
          kycStatus={kyc?.status ?? null}
        />
      </div>
    </div>
  );
}
