"use client";

// نمایش عمومی یک تب: فیلتر زیرمجموعه، بازه زمانی، جستجو، لیست ردیف ها و صفحه بندی
import { useState } from "react";
import { Loader2, Search, ChevronRight, ChevronLeft, ImageIcon } from "lucide-react";
import { formatDateTimeCustom, toPersianDigits } from "@/lib/format";
import type { TabPage, UserRow } from "@/lib/admin-user-data";
import type { UserTab } from "@/lib/permissions";
import UserLink from "@/components/admin/user-modal/UserLink";
import CountryFlag from "@/components/admin/CountryFlag";
import { countryNameFa } from "@/lib/country";
import { useJson } from "@/components/admin/user-modal/useJson";
import { TAB_KINDS, RANGE_OPTIONS, isSearchable, type KindOption } from "@/components/admin/user-modal/tab-meta";

export type TabQuery = { kind: string; range: string; q: string; page: number };

type Props = {
  userId: string;
  tab: Exclude<UserTab, "summary">;
  query: TabQuery;
  onQuery: (next: Partial<TabQuery>) => void;
  onRowClick?: (row: UserRow) => void;
};

const TONE_CLASS: Record<UserRow["tone"], string> = {
  gold: "text-[#d4af37]",
  green: "text-[#34d399]",
  red: "text-[#f87171]",
  muted: "text-[#888]",
};

export function buildTabUrl(userId: string, tab: string, q: TabQuery): string {
  const p = new URLSearchParams({ page: String(q.page), pageSize: "25", range: q.range });
  if (q.kind) p.set("kind", q.kind);
  if (q.q) p.set("q", q.q);
  return `/api/admin/users/${encodeURIComponent(userId)}/tabs/${tab}?${p.toString()}`;
}

export function buildExportUrl(userId: string, tab: string, q: TabQuery): string {
  const p = new URLSearchParams({ range: q.range });
  if (q.kind) p.set("kind", q.kind);
  if (q.q) p.set("q", q.q);
  return `/api/admin/users/${encodeURIComponent(userId)}/tabs/${tab}/export?${p.toString()}`;
}

export default function DataPanel({ userId, tab, query, onQuery, onRowClick }: Props) {
  const url = buildTabUrl(userId, tab, query);
  const { data, error, loading, reload } = useJson<TabPage>(url);
  const [draft, setDraft] = useState(query.q);
  const kinds: KindOption[] = TAB_KINDS[tab] ?? [];
  const searchable = isSearchable(tab, query.kind);

  return (
    <div className="space-y-3">
      {kinds.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {kinds.map((k) => (
            <button
              key={k.key || "default"}
              type="button"
              onClick={() => onQuery({ kind: k.key, page: 1, q: "" })}
              aria-pressed={query.kind === k.key}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                query.kind === k.key ? "lux-btn-gold" : "lux-card text-[#888] hover:text-[#d4af37]"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => onQuery({ range: r.key, page: 1 })}
              aria-pressed={query.range === r.key}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                query.range === r.key ? "bg-[rgba(212,175,55,0.18)] text-[#d4af37]" : "text-[#888] hover:text-[#d4af37]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {searchable && (
          <form
            className="flex flex-1 min-w-[12rem] items-center gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              onQuery({ q: draft.trim(), page: 1 });
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#666]" aria-hidden />
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="جستجو"
                aria-label="جستجو در این بخش"
                className="w-full pr-8 pl-2 py-1.5 rounded-lg bg-[#0d0d0d] border border-[rgba(212,175,55,0.15)] text-[#e8e8e8] text-xs outline-none focus:border-[rgba(212,175,55,0.4)]"
              />
            </div>
            <button type="submit" className="px-2.5 py-1.5 rounded-lg lux-btn-outline text-[11px] font-bold">
              جستجو
            </button>
          </form>
        )}
        <button type="button" onClick={reload} className="px-2.5 py-1.5 rounded-lg lux-btn-outline text-[11px] font-bold">
          بازخوانی
        </button>
        <a
          href={buildExportUrl(userId, tab, query)}
          download
          className="px-2.5 py-1.5 rounded-lg lux-btn-gold text-[11px] font-bold"
        >
          خروجی اکسل
        </a>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-[rgba(212,175,55,0.6)] animate-spin" aria-label="در حال بارگذاری" />
        </div>
      )}
      {error && <p className="text-xs text-[#f87171] py-4 text-center">{error}</p>}

      {data && (
        <>
          <p className="text-[11px] text-[#888]">{toPersianDigits(data.total)} مورد</p>
          {data.rows.length === 0 ? (
            <div className="lux-card p-8 text-center text-sm text-[#888]">موردی برای نمایش وجود ندارد</div>
          ) : (
            <ul className="space-y-2">
              {data.rows.map((row) => (
                <RowItem key={row.id} row={row} onClick={onRowClick ? () => onRowClick(row) : undefined} />
              ))}
            </ul>
          )}

          {(data.page > 1 || data.hasMore) && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={data.page <= 1}
                onClick={() => onQuery({ page: query.page - 1 })}
                className="px-3 py-1.5 rounded-lg lux-btn-outline text-xs font-bold disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronRight className="w-3.5 h-3.5" aria-hidden />
                قبلی
              </button>
              <span className="text-[11px] text-[#888]">صفحه {toPersianDigits(data.page)}</span>
              <button
                type="button"
                disabled={!data.hasMore}
                onClick={() => onQuery({ page: query.page + 1 })}
                className="px-3 py-1.5 rounded-lg lux-btn-outline text-xs font-bold disabled:opacity-40 flex items-center gap-1"
              >
                بعدی
                <ChevronLeft className="w-3.5 h-3.5" aria-hidden />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RowItem({ row, onClick }: { row: UserRow; onClick?: () => void }) {
  return (
    <li
      onClick={onClick}
      className={`lux-card p-3 flex flex-col sm:flex-row gap-3 ${onClick ? "cursor-pointer hover:border-[rgba(212,175,55,0.35)]" : ""}`}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-bold text-[#e8e8e8] flex flex-wrap items-center gap-1.5">
          {row.title}
          {row.deleted && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(248,113,113,0.12)] text-[#f87171] font-bold">حذف شده</span>
          )}
        </p>
        {row.other && (
          <p className="text-xs text-[#888]">
            طرف مقابل: <UserLink userId={row.other.id}>{row.other.name}</UserLink>{" "}
            <span dir="ltr" className="text-[#666]">@{row.other.username}</span>
          </p>
        )}
        {row.subtitle && <p className="text-xs text-[#888] break-words">{row.subtitle}</p>}
        {row.images.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {row.images.map((src) => (
              <a key={src} href={src} target="_blank" rel="noreferrer" className="block w-16 h-16 rounded-lg overflow-hidden border border-[rgba(212,175,55,0.2)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
              </a>
            ))}
          </div>
        )}
        {row.video && <video src={row.video} controls preload="none" className="w-full max-w-sm rounded-lg pt-1" aria-label="ویدیو یا پیام صوتی" />}
      </div>
      <div className="shrink-0 text-right sm:text-left space-y-1">
        {row.value && <p className="text-xs font-bold text-[#e8e8e8]">{row.value}</p>}
        {row.status && <p className={`text-[11px] font-bold ${TONE_CLASS[row.tone]}`}>{row.status}</p>}
        {row.country !== undefined && (
          <p className="text-[11px] text-[#888] flex items-center justify-end sm:justify-start gap-1.5">
            <CountryFlag code={row.country} />
            {countryNameFa(row.country)}
          </p>
        )}
        <p className="text-[10px] text-[#666]">{formatDateTimeCustom(row.at)}</p>
        {row.images.length > 0 && <ImageIcon className="inline w-3 h-3 text-[#666]" aria-hidden />}
      </div>
    </li>
  );
}
