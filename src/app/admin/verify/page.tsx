// صفحه مدیریت احراز هویت — درخواست های تیک آبی و احراز هویت کامل
import Link from "next/link";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toPersianDigits } from "@/lib/format";
import { isoToJalaliDisplay } from "@/lib/jalali";
import VerifyReviewClient from "./VerifyReviewClient";
import AdminPagination from "@/components/admin/AdminPagination";

const PAGE_SIZE = 15;

const kindLabels: Record<string, string> = {
  BLUE_TICK: "تیک آبی",
  KYC: "احراز هویت کامل",
};

export default async function AdminVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; kind?: string }>;
}) {
  const { page: pageStr, kind } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const kindFilter = kind === "BLUE_TICK" || kind === "KYC" ? kind : undefined;

  const [pendingRequests, reviewedRequests, totalReviewed] = await Promise.all([
    prisma.verificationRequest.findMany({
      where: {
        status: "PENDING",
        ...(kindFilter ? { kind: kindFilter } : {}),
        user: { role: "USER" },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.verificationRequest.findMany({
      where: {
        status: { in: ["APPROVED", "REJECTED"] },
        ...(kindFilter ? { kind: kindFilter } : {}),
        user: { role: "USER" },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { reviewedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.verificationRequest.count({
      where: {
        status: { in: ["APPROVED", "REJECTED"] },
        ...(kindFilter ? { kind: kindFilter } : {}),
        user: { role: "USER" },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalReviewed / PAGE_SIZE);

  const filters = [
    { key: "", label: "همه" },
    { key: "BLUE_TICK", label: "تیک آبی" },
    { key: "KYC", label: "احراز هویت کامل" },
  ];

  return (
    <div className="space-y-6">
      <div className="lux-card p-5">
        <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
          <BadgeCheck className="w-5 h-5 text-[#d4af37]" />
          احراز هویت کاربران
        </h1>
        <p className="text-[#888] mt-1 text-xs">
          {toPersianDigits(pendingRequests.length)} درخواست در انتظار بررسی
        </p>
      </div>

      {/* فیلتر نوع درخواست */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={f.key ? `/admin/verify?kind=${f.key}` : "/admin/verify"}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              (kindFilter ?? "") === f.key
                ? "bg-[#d4af37] text-black"
                : "bg-[rgba(212,175,55,0.1)] text-[#d4af37] hover:bg-[rgba(212,175,55,0.2)]"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {pendingRequests.length === 0 ? (
        <div className="lux-card p-8 text-center">
          <p className="text-sm text-[#888]">درخواست احراز هویت در انتظاری وجود ندارد</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((r) => {
            const selfies: string[] = (() => {
              try {
                return JSON.parse(r.selfieUrls) as string[];
              } catch {
                return [];
              }
            })();
            return (
              <div key={r.id} className="lux-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-[#e8e8e8]">
                      {r.user.firstName} {r.user.lastName}
                    </p>
                    <p className="text-xs text-[#888]">
                      @{r.user.username} — {r.user.phone}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.kind === "BLUE_TICK"
                          ? "bg-[rgba(59,130,246,0.1)] text-[#60a5fa]"
                          : "bg-[rgba(212,175,55,0.1)] text-[#d4af37]"
                      }`}
                    >
                      {r.kind === "BLUE_TICK" ? (
                        <span className="flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3" />
                          تیک آبی
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          احراز هویت کامل
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-[#888]">
                      {new Date(r.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                    {/* نتیجه تشخیص چهره خودکار */}
                    {r.autoResult === "FACE_OK" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(16,185,129,0.1)] text-[#34d399]">
                        چهره شناسایی شد ({toPersianDigits(Math.round((r.faceScore ?? 0) * 100))}٪)
                      </span>
                    )}
                    {r.autoResult === "FACE_NOT_FOUND" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(239,68,68,0.1)] text-[#f87171]">
                        چهره نامشخص ({toPersianDigits(r.faceCount ?? 0)} چهره)
                      </span>
                    )}
                    {r.autoResult === "MANUAL" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(212,175,55,0.1)] text-[#d4af37]">
                        بررسی دستی
                      </span>
                    )}
                  </div>
                </div>

                {/* مشخصات احراز هویت کامل */}
                {r.kind === "KYC" && (
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(212,175,55,0.1)] px-2 py-2">
                      <p className="text-[10px] text-[#888]">نام واقعی</p>
                      <p className="text-xs font-bold text-[#e8e8e8] mt-0.5 truncate">
                        {r.fullName}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(212,175,55,0.1)] px-2 py-2">
                      <p className="text-[10px] text-[#888]">کد ملی</p>
                      <p className="text-xs font-bold text-[#e8e8e8] mt-0.5" dir="ltr">
                        {r.nationalCode}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(212,175,55,0.1)] px-2 py-2">
                      <p className="text-[10px] text-[#888]">تاریخ تولد</p>
                      <p className="text-xs font-bold text-[#e8e8e8] mt-0.5">
                        {r.birthDate ? isoToJalaliDisplay(r.birthDate) : "—"}
                      </p>
                    </div>
                  </div>
                )}

                {/* عکس های سلفی */}
                {selfies.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-bold text-[#d4af37] mb-1.5">
                      عکس های سلفی ({toPersianDigits(selfies.length)})
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {selfies.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer">
                          <img
                            src={url}
                            alt={`سلفی ${i + 1}`}
                            className="w-full aspect-square object-cover rounded-lg border border-[rgba(212,175,55,0.1)]"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* کارت ملی */}
                {(r.idCardFrontUrl || r.idCardBackUrl) && (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {r.idCardFrontUrl && (
                      <div>
                        <p className="text-xs font-bold text-[#d4af37] mb-1.5">روی کارت ملی</p>
                        <a href={r.idCardFrontUrl} target="_blank" rel="noreferrer">
                          <img
                            src={r.idCardFrontUrl}
                            alt="روی کارت ملی"
                            className="w-full rounded-lg border border-[rgba(212,175,55,0.1)]"
                          />
                        </a>
                      </div>
                    )}
                    {r.idCardBackUrl && (
                      <div>
                        <p className="text-xs font-bold text-[#d4af37] mb-1.5">پشت کارت ملی</p>
                        <a href={r.idCardBackUrl} target="_blank" rel="noreferrer">
                          <img
                            src={r.idCardBackUrl}
                            alt="پشت کارت ملی"
                            className="w-full rounded-lg border border-[rgba(212,175,55,0.1)]"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* پیام صوتی */}
                {r.voiceUrl && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-[#d4af37] mb-1.5">پیام صوتی</p>
                    <audio controls src={r.voiceUrl} className="w-full h-9" />
                  </div>
                )}

                <VerifyReviewClient requestId={r.id} />
              </div>
            );
          })}
        </div>
      )}

      {reviewedRequests.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#d4af37] mb-3">آخرین بررسی شده ها</h2>
          <div className="lux-card divide-y divide-[rgba(212,175,55,0.08)]">
            {reviewedRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-bold text-[#e8e8e8]">
                    {r.user.firstName} {r.user.lastName}
                  </p>
                  <p className="text-xs text-[#888]">
                    @{r.user.username} — {kindLabels[r.kind] ?? r.kind}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    r.status === "APPROVED"
                      ? "bg-[rgba(16,185,129,0.1)] text-[#34d399]"
                      : "bg-[rgba(239,68,68,0.1)] text-[#f87171]"
                  }`}
                >
                  {r.status === "APPROVED" ? "تایید شده" : "رد شده"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <AdminPagination currentPage={page} totalPages={totalPages} totalItems={totalReviewed} pageSize={PAGE_SIZE} />
    </div>
  );
}
