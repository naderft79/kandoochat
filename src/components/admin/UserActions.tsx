"use client";

// اکشن های مدیریت کاربر: تایید موبایل، تیک آبی، مسدودسازی و ورود به پنل
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Ban, CircleCheck, Phone, ShieldCheck, LogIn, Loader2, Star, KeyRound, Smartphone, Bot } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export default function UserActions({
  userId,
  role = "USER",
  isVerified,
  isActive,
  phoneVerified,
  isSpecial,
  isFake,
  canSetRole = false,
  offset = 0,
}: {
  userId: string;
  role?: string;
  isVerified: boolean;
  isActive: boolean;
  phoneVerified: boolean;
  isSpecial: boolean;
  isFake?: boolean;
  canSetRole?: boolean;
  offset?: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [changingPhone, setChangingPhone] = useState(false);
  const [localPhoneVerified, setLocalPhoneVerified] = useState(phoneVerified);
  const [localIsVerified, setLocalIsVerified] = useState(isVerified);
  const [localIsActive, setLocalIsActive] = useState(isActive);
  const [localIsSpecial, setLocalIsSpecial] = useState(isSpecial);
  const [localIsFake, setLocalIsFake] = useState(isFake ?? false);
  const [localRole, setLocalRole] = useState(role);

  async function impersonate() {
    setImpersonating(true);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.redirect;
      } else {
        const data = await res.json();
        toast(data.error ?? "خطایی رخ داد", "error");
      }
    } finally {
      setImpersonating(false);
    }
  }

  async function resetPassword() {
    setResettingPassword(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "resetPassword" }),
      });
      const data = await res.json();
      if (res.ok && data.tempPassword) {
        setTempPassword(data.tempPassword);
        toast("رمز موقت تولید شد", "success");
      } else {
        toast(data.error ?? "خطایی رخ داد", "error");
      }
    } catch {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setResettingPassword(false);
    }
  }

  async function changePhone() {
    if (!newPhone.trim()) {
      toast("شماره موبایل را وارد کنید", "error");
      return;
    }
    setChangingPhone(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "changePhone", phone: newPhone.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("شماره موبایل تغییر یافت", "success");
        setShowPhoneModal(false);
        setNewPhone("");
        router.refresh();
      } else {
        toast(data.error ?? "خطایی رخ داد", "error");
      }
    } catch {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setChangingPhone(false);
    }
  }

  async function act(action: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      if (res.ok) {
        switch (action) {
          case "verifyPhone": setLocalPhoneVerified(true); break;
          case "unverifyPhone": setLocalPhoneVerified(false); break;
          case "verifyBadge": setLocalIsVerified(true); break;
          case "unverifyBadge": setLocalIsVerified(false); break;
          case "activate": setLocalIsActive(true); break;
          case "deactivate": setLocalIsActive(false); break;
          case "makeSpecial": setLocalIsSpecial(true); break;
          case "unmakeSpecial": setLocalIsSpecial(false); break;
        }
        router.refresh();
      } else {
        const data = await res.json();
        toast(data.error ?? "خطایی رخ داد", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  const buttonBase = "px-2 py-2 rounded-lg lux-btn-gold text-[10px] font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1 text-center";

  const inactiveBtn = "px-2 py-2 rounded-lg lux-btn-outline text-[10px] font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1 text-center";

  const total = offset + 6;
  const remainder = total % 4;
  const itemsInLastRow = remainder === 0 ? 4 : remainder;
  const lastRowStart = total - itemsInLastRow;

  const colSpanMap: Record<number, string> = {
    1: "col-span-4",
    2: "col-span-2",
    3: "col-span-1",
    4: "col-span-1",
  };
  const lastRowSpan = colSpanMap[itemsInLastRow] ?? "";

  function spanClass(indexInActions: number) {
    const globalIndex = offset + indexInActions;
    if (globalIndex >= lastRowStart) return lastRowSpan;
    return "";
  }

  return (
    <>
      {/* تایید موبایل */}
      {localPhoneVerified ? (
        <button
          onClick={() => act("unverifyPhone")}
          disabled={loading}
          className={`${buttonBase} ${spanClass(0)}`}
        >
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">لغو موبایل</span>
        </button>
      ) : (
        <button
          onClick={() => act("verifyPhone")}
          disabled={loading}
          className={`${inactiveBtn} ${spanClass(0)}`}
        >
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">تایید موبایل</span>
        </button>
      )}

      {/* تیک آبی */}
      {localIsVerified ? (
        <button
          onClick={() => act("unverifyBadge")}
          disabled={loading}
          className={`${buttonBase} ${spanClass(1)}`}
        >
          <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">لغو تیک</span>
        </button>
      ) : (
        <button
          onClick={() => act("verifyBadge")}
          disabled={loading}
          className={`${inactiveBtn} ${spanClass(1)}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">تیک آبی</span>
        </button>
      )}

      {/* مسدودسازی */}
      {localIsActive ? (
        <button
          onClick={() => act("deactivate")}
          disabled={loading}
          className={`${buttonBase} ${spanClass(2)}`}
        >
          <Ban className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">مسدود</span>
        </button>
      ) : (
        <button
          onClick={() => act("activate")}
          disabled={loading}
          className={`${inactiveBtn} ${spanClass(2)}`}
        >
          <CircleCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">رفع مسدود</span>
        </button>
      )}

      {/* کاربر ویژه */}
      {localIsSpecial ? (
        <button
          onClick={() => act("unmakeSpecial")}
          disabled={loading}
          className={`${buttonBase} ${spanClass(3)}`}
        >
          <Star className="w-3.5 h-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
          <span className="truncate">لغو ویژه</span>
        </button>
      ) : (
        <button
          onClick={() => act("makeSpecial")}
          disabled={loading}
          className={`${inactiveBtn} ${spanClass(3)}`}
        >
          <Star className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">ویژه</span>
        </button>
      )}

      {/* ورود به پنل کاربر */}
      <button
        onClick={impersonate}
        disabled={impersonating || loading}
        className={`${buttonBase} ${spanClass(4)}`}
      >
        {impersonating ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <LogIn className="w-3.5 h-3.5 shrink-0" />}
        <span className="truncate">ورود به پنل</span>
      </button>

      {/* ریست رمز عبور */}
      <button
        onClick={resetPassword}
        disabled={resettingPassword || loading}
        className={`${buttonBase} ${spanClass(5)}`}
      >
        {resettingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <KeyRound className="w-3.5 h-3.5 shrink-0" />}
        <span className="truncate">ریست رمز</span>
      </button>

      {/* تغییر شماره موبایل */}
      <button
        onClick={() => setShowPhoneModal(true)}
        disabled={loading}
        className={`${buttonBase} ${spanClass(6)}`}
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">تغییر شماره</span>
      </button>

      {/* کاربر فیک (ربات) */}
      <button
        onClick={async () => {
          setLoading(true);
          try {
            const res = await fetch("/api/admin/users", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, action: "toggleFake" }),
            });
            if (res.ok) {
              const data = await res.json();
              setLocalIsFake(data.isFake);
              toast(data.isFake ? "کاربر به عنوان فیک علامت خورد" : "علامت فیک برداشته شد", "success");
              router.refresh();
            } else {
              const data = await res.json();
              toast(data.error ?? "خطایی رخ داد", "error");
            }
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading}
        className={`${localIsFake ? buttonBase : inactiveBtn} ${spanClass(7)}`}
      >
        <Bot className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{localIsFake ? "لغو فیک" : "فیک"}</span>
      </button>

      {/* تغییر نقش — فقط سوپر ادمین */}
      {canSetRole && (
        <select
          value={localRole}
          disabled={loading}
          onChange={async (e) => {
            const newRole = e.target.value;
            setLoading(true);
            try {
              const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, action: "setRole", role: newRole }),
              });
              const data = await res.json();
              if (res.ok) {
                setLocalRole(newRole);
                toast("نقش کاربر تغییر کرد", "success");
                router.refresh();
              } else {
                e.target.value = localRole;
                toast(data.error ?? "خطایی رخ داد", "error");
              }
            } finally {
              setLoading(false);
            }
          }}
          className={`${inactiveBtn} ${spanClass(8)} appearance-none cursor-pointer`}
        >
          <option value="USER">کاربر</option>
          <option value="ADMIN">ادمین</option>
          <option value="CONTENT_ADMIN">ادمین محتوا</option>
          <option value="SUPPORT_ADMIN">ادمین پشتیبانی</option>
          <option value="SUPER_ADMIN">سوپر ادمین</option>
        </select>
      )}

      {/* مودال نمایش رمز موقت */}
      {/* مودال تغییر شماره موبایل */}
      {showPhoneModal && (
        <div className="col-span-4 mt-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs font-bold text-blue-800">تغییر شماره موبایل</p>
            <button
              onClick={() => setShowPhoneModal(false)}
              className="text-blue-400 hover:text-blue-600 text-xs"
            >
              بستن
            </button>
          </div>
          <input
            type="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="شماره موبایل جدید"
            dir="ltr"
            className="w-full px-3 py-2 rounded-lg bg-white border border-blue-200 text-sm outline-none focus:border-blue-400 text-left"
          />
          <button
            onClick={changePhone}
            disabled={changingPhone}
            className="w-full mt-2 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {changingPhone ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "تایید تغییر"}
          </button>
        </div>
      )}

      {tempPassword && (
        <div className="col-span-4 mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-amber-800">رمز موقت کاربر:</p>
              <p className="text-sm font-mono text-amber-900 mt-1" dir="ltr">{tempPassword}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tempPassword);
                  toast("کپی شد", "success");
                }}
                className="px-2 py-1 rounded-lg bg-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-300 transition-colors"
              >
                کپی
              </button>
              <button
                onClick={() => setTempPassword(null)}
                className="px-2 py-1 rounded-lg bg-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-300 transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
