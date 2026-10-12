"use client";

// صفحه لیست بلاک شده ها — مدیریت کاربران بلاک شده
import { useEffect, useState } from "react";
import { Ban, ArrowRight, UserX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import { toPersianDigits } from "@/lib/format";

type BlockedUser = {
  id: string;
  blockedId: string;
  reason: string | null;
  createdAt: string;
  blocked: {
    id: string;
    firstName: string;
    lastName: string;
    age: number;
    city: string;
  };
};

export default function BlockedPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [blocks, setBlocks] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/block")
      .then((r) => r.json())
      .then((data) => {
        if (data.blocks) setBlocks(data.blocks);
      })
      .finally(() => setLoading(false));
  }, []);

  async function unblock(blockedId: string) {
    setUnblocking(blockedId);
    try {
      const res = await fetch(`/api/block?blockedId=${blockedId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBlocks((prev) => prev.filter((b) => b.blockedId !== blockedId));
        toast("کاربر از بلاک خارج شد");
      } else {
        toast("خطا در خارج کردن از بلاک");
      }
    } catch {
      toast("خطای شبکه");
    } finally {
      setUnblocking(null);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 md:py-10">
      {/* هدر */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/dashboard/settings")}
          className="p-2 rounded-lg hover:bg-ig-gray-bg transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-ig-gray-bg flex items-center justify-center">
            <Ban className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">بلاک لیست</h1>
            <p className="text-xs text-ig-gray">کاربران بلاک شده توسط شما</p>
          </div>
        </div>
      </div>

      {/* لیست */}
      {loading ? (
        <div className="text-center py-10">
          <p className="text-sm text-ig-gray">در حال بارگذاری...</p>
        </div>
      ) : blocks.length === 0 ? (
        <div className="bg-surface border border-ig-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-ig-gray-bg flex items-center justify-center mx-auto mb-3">
            <UserX className="w-8 h-8 text-ig-gray" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-bold text-foreground mb-1">کاربری بلاک نشده</p>
          <p className="text-xs text-ig-gray leading-5">
            کاربران بلاک شده در اینجا نمایش داده می شوند
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="bg-surface border border-ig-border rounded-2xl p-3 flex items-center gap-3"
            >
              <DefaultAvatar size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {block.blocked.firstName} {block.blocked.lastName}
                </p>
                <p className="text-xs text-ig-gray">
                  {toPersianDigits(block.blocked.age)} ساله · {block.blocked.city}
                </p>
                {block.reason && (
                  <p className="text-xs text-ig-gray mt-0.5 line-clamp-1">
                    دلیل: {block.reason}
                  </p>
                )}
              </div>
              <button
                onClick={() => unblock(block.blockedId)}
                disabled={unblocking === block.blockedId}
                className="px-3 py-1.5 rounded-lg bg-ig-gray-bg text-xs font-bold text-foreground hover:bg-neutral-200 transition-colors disabled:opacity-50 shrink-0"
              >
                {unblocking === block.blockedId ? "..." : "آنبلاک"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
