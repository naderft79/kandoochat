"use client";

// دکمه های اکشن پروفایل: ویرایش در شیت، اشتراک گذاری، نمایش به چشم دیگران
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Share2, Eye } from "lucide-react";
import { BottomSheet } from "@/components/ui/Modal";
import ProfileForm from "@/components/dashboard/ProfileForm";
import { OPEN_PROFILE_EDIT_EVENT } from "@/components/dashboard/ProfileCompletionCard";
import { useToast } from "@/components/ToastProvider";
import { nativeShare as capShare, nativeCopy } from "@/lib/native";
import { useBrand } from "@/components/BrandProvider";

type ProfileData = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  province: string;
  city: string;
  age: number;
  height: number;
  weight: number;
  income: number;
  job: string | null;
  bio: string | null;
};

export default function ProfileActions({ initial }: { initial: ProfileData }) {
  const brand = useBrand();
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // کلیک روی نوار تکمیل پروفایل این رویداد را می فرستد و شیت ویرایش باز می شود
  useEffect(() => {
    const open = () => setEditOpen(true);
    window.addEventListener(OPEN_PROFILE_EDIT_EVENT, open);
    return () => window.removeEventListener(OPEN_PROFILE_EDIT_EVENT, open);
  }, []);

  async function share() {
    const url = `${window.location.origin}/profile/${initial.id}`;
    const ok = await capShare({ title: `پروفایل من در ${brand.name}`, url });
    if (!ok) {
      if (await nativeCopy(url)) toast("لینک پروفایل کپی شد", "success");
    }
  }

  const btn = "flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-ig-btn2 text-sm font-bold text-foreground hover:bg-ig-btn2-hover transition-colors active:scale-[0.98]";

  return (
    <>
      <div className="flex gap-2 mt-4">
        <button type="button" onClick={() => setEditOpen(true)} className={btn}>
          <Settings className="w-4 h-4" strokeWidth={2} />
          ویرایش پروفایل
        </button>
        <button type="button" onClick={share} className={btn}>
          <Share2 className="w-4 h-4" strokeWidth={2} />
          اشتراک گذاری پروفایل
        </button>
      </div>

      <BottomSheet open={editOpen} onClose={() => setEditOpen(false)} title="ویرایش پروفایل">
        <div className="px-4 pb-4">
          {/* نمایش به چشم دیگران */}
          <button
            type="button"
            onClick={() => {
              // اول ورودی تاریخچه مودال بسته می شود تا cleanup ناوبری را برنگرداند
              window.history.back();
              setTimeout(() => router.push(`/profile/${initial.id}`), 50);
            }}
            className="w-full mb-3 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-ig-gray-bg text-sm font-bold text-foreground hover:bg-ig-btn2-hover transition-colors"
          >
            <Eye className="w-4 h-4" strokeWidth={2} />
            نمایش پروفایل به چشم دیگران
          </button>
          <ProfileForm initial={initial} onClose={() => setEditOpen(false)} />
        </div>
      </BottomSheet>
    </>
  );
}
