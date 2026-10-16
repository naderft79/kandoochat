"use client";

// مودال یکپارچه پروفایل کاربر: هدر (هویت + دکمه های عملیاتی)، ناوبری تب ها و محتوای هر تب
// میزبان مودال یک ظرف با کلاس lux-admin-bg است تا قواعد تم روشن/تاریک پنل ادمین روی آن اعمال شود.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, BadgeCheck, Bot, Activity, Image as ImageIcon, Loader2, MessageCircle, User, Wallet, X } from "lucide-react";
import { useOverlay } from "@/components/ui/Modal";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import UserCoinModal from "@/components/admin/UserCoinModal";
import UserSubscriptionModal from "@/components/admin/UserSubscriptionModal";
import MessageLockModal from "@/components/admin/MessageLockModal";
import UserEditModal from "@/components/admin/UserEditModal";
import AdminUserPhotosModal from "@/components/admin/AdminUserPhotosModal";
import type { UserSummary, UserRow } from "@/lib/admin-user-data";
import { USER_TABS, type UserTab } from "@/lib/permissions";
import { useJson } from "@/components/admin/user-modal/useJson";
import SummaryPane from "@/components/admin/user-modal/SummaryPane";
import DataPanel, { type TabQuery } from "@/components/admin/user-modal/DataPanel";
import ConversationView from "@/components/admin/user-modal/ConversationView";
import ActionsBar, { type ActiveModal } from "@/components/admin/user-modal/ActionsBar";
import DeleteUserModal from "@/components/admin/DeleteUserModal";
import { TAB_LABELS } from "@/components/admin/user-modal/tab-meta";

const TAB_ICONS: Record<UserTab, typeof User> = {
  summary: User,
  finance: Wallet,
  media: ImageIcon,
  messages: MessageCircle,
  activity: Activity,
  verification: BadgeCheck,
  bot: Bot,
};

const EMPTY_QUERY: TabQuery = { kind: "", range: "all", q: "", page: 1 };

type Props = {
  userId: string;
  depth: number;
  onBack: () => void;
  onClose: () => void;
};

export default function UserModal({ userId, depth, onBack, onClose }: Props) {
  // میزبان جداگانه با کلاس تم پنل ادمین، به body اضافه و هنگام بسته شدن حذف می شود
  const host = useMemo<HTMLDivElement | null>(() => {
    if (typeof document === "undefined") return null;
    const el = document.createElement("div");
    el.className = "lux-admin-bg fixed inset-0 z-[90]";
    return el;
  }, []);
  useEffect(() => {
    if (!host) return;
    document.body.appendChild(host);
    return () => {
      host.remove();
    };
  }, [host]);

  if (!host) return null;
  return createPortal(
    <Overlay userId={userId} depth={depth} onBack={onBack} onClose={onClose} />,
    host
  );
}

function Overlay({ userId, depth, onBack, onClose }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  // Esc و کلیک پس زمینه فقط وقتی مودال پایه را می بندند که دیالوگ دیگری (مثلاً مودال سکه) باز نباشد
  const guardedClose = useCallback(() => {
    if (document.querySelectorAll('[role="dialog"][aria-modal="true"]').length > 1) return;
    onClose();
  }, [onClose]);

  useOverlay(true, guardedClose, panel);

  return (
    <div className="absolute inset-0 flex items-stretch md:items-center justify-center md:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={guardedClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="پروفایل کاربر"
        tabIndex={-1}
        className="lux-card lux-user-modal relative flex flex-col w-full h-full md:h-[88dvh] md:max-w-6xl overflow-hidden outline-none"
      >
        <ModalBody key={userId} userId={userId} depth={depth} onBack={onBack} onClose={guardedClose} />
      </div>
    </div>
  );
}

function ModalBody({ userId, depth, onBack, onClose }: Props) {
  const summary = useJson<{ summary: UserSummary }>(`/api/admin/users/${encodeURIComponent(userId)}/summary`);
  const [tab, setTab] = useState<UserTab>("summary");
  const [query, setQuery] = useState<TabQuery>(EMPTY_QUERY);
  const [conv, setConv] = useState<{ id: string; title: string } | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const s = summary.data?.summary;
  const visibleTabs = s ? USER_TABS.filter((t) => s.allowedTabs.includes(t)) : [];

  function selectTab(next: UserTab) {
    setTab(next);
    setQuery(EMPTY_QUERY);
    setConv(null);
  }

  function changeQuery(patch: Partial<TabQuery>) {
    setQuery((prev) => ({ ...prev, ...patch }));
  }

  const photosUser = s
    ? { id: s.id, firstName: s.firstName, lastName: s.lastName, username: s.username, photos: s.photos }
    : null;

  return (
    <>
      <header className="shrink-0 border-b border-[rgba(212,175,55,0.12)] px-4 md:px-6 py-3 space-y-3">
        <div className="flex items-start gap-3">
          {depth > 1 && (
            <button
              type="button"
              onClick={onBack}
              className="shrink-0 px-2.5 py-2 rounded-lg lux-btn-outline text-xs font-bold flex items-center gap-1"
              aria-label="بازگشت به کاربر قبلی"
            >
              <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              بازگشت
            </button>
          )}
          <div className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden ring-2 ring-[rgba(212,175,55,0.3)]">
            {s?.photos.find((p) => p.isProfile)?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.photos.find((p) => p.isProfile)!.url} alt="" className="w-full h-full object-cover" />
            ) : (
              <DefaultAvatar size={64} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base md:text-lg font-black text-[#e8e8e8] truncate">
              {s ? `${s.firstName} ${s.lastName}` : summary.error ? "خطا" : "در حال بارگذاری…"}
            </h2>
            {s && (
              <p className="text-xs text-[#888]">
                <span dir="ltr">@{s.username}</span>{" "}
                <span dir="ltr">· {s.phone}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[#888] hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.08)]"
          >
            <X className="w-5 h-5" aria-hidden />
          </button>
        </div>
        {s && (
          <ActionsBar s={s} onOpen={setActiveModal} onChanged={summary.reload} />
        )}
      </header>

      {summary.loading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-[rgba(212,175,55,0.6)] animate-spin" aria-label="در حال بارگذاری" />
        </div>
      )}
      {summary.error && <p className="flex-1 flex items-center justify-center text-sm text-[#f87171]">{summary.error}</p>}

      {s && (
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          <nav aria-label="بخش های کاربر" className="shrink-0 flex md:flex-col gap-1 overflow-x-auto no-scrollbar md:overflow-y-auto md:w-52 p-2 border-b md:border-b-0 md:border-l border-[rgba(212,175,55,0.12)]">
            {visibleTabs.map((t) => {
              const Icon = TAB_ICONS[t];
              const active = t === tab;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => selectTab(t)}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
                    active ? "lux-btn-gold" : "text-[#888] hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.06)]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden />
                  {TAB_LABELS[t]}
                </button>
              );
            })}
          </nav>

          <section className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
            {tab === "summary" && <SummaryPane s={s} />}
            {tab === "messages" && !conv && (
              <DataPanel
                key="messages"
                userId={userId}
                tab="messages"
                query={query}
                onQuery={changeQuery}
                onRowClick={(row: UserRow) => setConv({ id: row.id, title: row.other?.name ?? row.title })}
              />
            )}
            {tab === "messages" && conv && (
              <ConversationView userId={userId} convId={conv.id} title={conv.title} onBack={() => setConv(null)} />
            )}
            {tab !== "summary" && tab !== "messages" && (
              <DataPanel key={tab} userId={userId} tab={tab} query={query} onQuery={changeQuery} />
            )}
          </section>
        </div>
      )}

      {s && activeModal === "coin" && (
        <UserCoinModal
          userId={s.id}
          currentBalance={s.balance}
          onClose={() => setActiveModal(null)}
          onSuccess={() => { setActiveModal(null); summary.reload(); }}
        />
      )}
      {s && activeModal === "sub" && (
        <UserSubscriptionModal
          userId={s.id}
          subscription={s.subscription ? { startsAt: s.subscription.startsAt, endsAt: s.subscription.endsAt } : null}
          onClose={() => setActiveModal(null)}
          onSuccess={() => { setActiveModal(null); summary.reload(); }}
        />
      )}
      {s && activeModal === "lock" && (
        <MessageLockModal
          userId={s.id}
          messageLockUntil={s.messageLockUntil}
          messageLockReason={s.messageLockReason}
          onClose={() => setActiveModal(null)}
          onSuccess={() => { setActiveModal(null); summary.reload(); }}
        />
      )}
      {s && activeModal === "edit" && s.permissions.phoneFull && (
        <UserEditModal
          user={{
            id: s.id, firstName: s.firstName, lastName: s.lastName, username: s.username, phone: s.phone,
            gender: s.gender, age: s.age, height: s.height, weight: s.weight, income: s.income,
            province: s.province, city: s.city, job: s.job,
            bio: s.bio,
          }}
          onClose={() => setActiveModal(null)}
          onSuccess={() => { setActiveModal(null); summary.reload(); }}
        />
      )}
      {s && activeModal === "delete" && (
        <DeleteUserModal
          userId={s.id}
          displayName={`${s.firstName} ${s.lastName}`}
          username={s.username}
          onClose={() => setActiveModal(null)}
          onSuccess={() => { setActiveModal(null); onClose(); }}
        />
      )}
      {photosUser && activeModal === "photos" && (
        <AdminUserPhotosModal
          user={photosUser}
          onClose={() => setActiveModal(null)}
          onUpdate={() => summary.reload()}
        />
      )}
    </>
  );
}
