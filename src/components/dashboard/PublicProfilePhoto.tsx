"use client";

// آواتار پروفایل عمومی — کلیک عکس را بزرگ می کند؛ داخل مودال دکمه لایک دارد
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, X, Loader2 } from "lucide-react";
import Portal from "@/components/ui/Portal";
import { useToast } from "@/components/ToastProvider";

type Props = {
  url: string;
  name: string;
  targetUserId: string;
  initialLiked: boolean;
  loggedIn: boolean;
};

export default function PublicProfilePhoto({ url, name, targetUserId, initialLiked, loggedIn }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);

  async function sendLike() {
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    if (liked || loading) return;
    // لایک برگشت ناپذیر است — خوش بینانه ثبت می کنیم و در خطا برمی گردانیم
    setLiked(true);
    setLoading(true);
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: targetUserId, type: "LIKE" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLiked(false);
        toast(data.error ?? "لایک ثبت نشد", "error");
      }
    } catch {
      setLiked(false);
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`بزرگ کردن عکس ${name}`}
        className="relative w-full h-full block active:scale-95 transition-transform"
      >
        <Image src={url} alt={name} fill className="object-cover" sizes="96px" />
      </button>

      {open && (
        <Portal>
          <div
            className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 ig-fade-in"
            onClick={() => setOpen(false)}
          >
            <div
              className="relative max-w-sm w-full ig-modal-in"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="بستن"
                className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-surface ig-shadow-lg flex items-center justify-center active:scale-90 transition-transform"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>

              <div className="rounded-2xl overflow-hidden ig-shadow-lg relative aspect-square">
                <Image
                  src={url}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 90vw, 384px"
                  priority
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                  <p className="text-white font-bold text-lg">{name}</p>
                </div>

                {/* دکمه ها روی عکس */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2.5 pb-5 justify-end pr-8 pl-4">
                  <button
                    onClick={sendLike}
                    disabled={loading}
                    className="w-11 h-11 rounded-full bg-surface hover:bg-ig-btn2 text-foreground flex items-center justify-center ig-shadow-lg active:scale-90 transition-all disabled:opacity-50"
                    title={liked ? "لایک شد" : "لایک"}
                    aria-pressed={liked}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Heart
                        className={`w-5 h-5 ${liked ? "text-ig-red" : ""}`}
                        fill={liked ? "currentColor" : "none"}
                        strokeWidth={2}
                      />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
