"use client";

// کامپوننت صفحه بندی مشترک برای پنل ادمین
import { useRouter, useSearchParams } from "next/navigation";
import { toPersianDigits } from "@/lib/format";
import { ChevronRight, ChevronLeft } from "lucide-react";

type Props = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
};

export default function AdminPagination({ currentPage, totalPages, totalItems, pageSize }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`?${params.toString()}`);
  }

  if (totalPages <= 1) {
    return (
      <p className="text-xs text-[#888] text-center py-3">
        مجموع: {toPersianDigits(totalItems)} مورد
      </p>
    );
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  // محاسبه صفحات قابل نمایش
  const pages: number[] = [];
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4">
      <p className="text-xs text-[#888]">
        {toPersianDigits(start)} تا {toPersianDigits(end)} از {toPersianDigits(totalItems)} مورد
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="w-8 h-8 rounded-lg border border-[rgba(212,175,55,0.15)] flex items-center justify-center disabled:opacity-30 hover:bg-[rgba(212,175,55,0.08)] transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-[#d4af37]" />
        </button>
        {startPage > 1 && (
          <>
            <button onClick={() => goToPage(1)} className="w-8 h-8 rounded-lg border border-[rgba(212,175,55,0.15)] text-xs font-bold text-[#e8e8e8] hover:bg-[rgba(212,175,55,0.08)] transition-colors">
              ۱
            </button>
            {startPage > 2 && <span className="text-[#888] text-xs px-1">...</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={`w-8 h-8 rounded-lg border text-xs font-bold transition-colors ${
              p === currentPage
                ? "lux-btn-gold border-transparent"
                : "border-[rgba(212,175,55,0.15)] text-[#e8e8e8] hover:bg-[rgba(212,175,55,0.08)]"
            }`}
          >
            {toPersianDigits(p)}
          </button>
        ))}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-[#888] text-xs px-1">...</span>}
            <button onClick={() => goToPage(totalPages)} className="w-8 h-8 rounded-lg border border-[rgba(212,175,55,0.15)] text-xs font-bold text-[#e8e8e8] hover:bg-[rgba(212,175,55,0.08)] transition-colors">
              {toPersianDigits(totalPages)}
            </button>
          </>
        )}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="w-8 h-8 rounded-lg border border-[rgba(212,175,55,0.15)] flex items-center justify-center disabled:opacity-30 hover:bg-[rgba(212,175,55,0.08)] transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#d4af37]" />
        </button>
      </div>
    </div>
  );
}
