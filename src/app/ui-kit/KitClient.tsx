"use client";

// صفحه نمونه کتابخانه UI — فقط برای توسعه و تست خودکار
import { useState } from "react";
import { Heart, Settings } from "lucide-react";
import { Button, IconButton, Input, PasswordInput, TextArea, Modal, BottomSheet, Toggle, Tabs, ListRow } from "@/components/ui";
import AlertModal from "@/components/AlertModal";
import { useToast } from "@/components/ToastProvider";

export default function KitClient() {
  const [dialog, setDialog] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [modal, setModal] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [on, setOn] = useState(true);
  const [tab, setTab] = useState<"a" | "b">("a");
  const { toast } = useToast();

  return (
    <main className="max-w-md mx-auto p-4 space-y-5">
      <h1 className="text-xl font-bold">کتابخانه UI</h1>

      <section className="space-y-2">
        <Button fullWidth>دکمه اصلی</Button>
        <Button variant="secondary" fullWidth>دکمه دوم</Button>
        <Button variant="ghost" fullWidth>دکمه متنی</Button>
        <Button variant="danger" fullWidth>حذف</Button>
        <Button loading fullWidth>در حال ارسال</Button>
        <IconButton aria-label="علاقه مندی"><Heart className="w-6 h-6" /></IconButton>
      </section>

      <section className="space-y-3">
        <Input label="شماره موبایل" inputMode="tel" dir="ltr" placeholder="09123456789" />
        <Input label="نام" error="نام را وارد کنید" />
        <PasswordInput label="رمز عبور" />
        <TextArea label="درباره من" hint="حداکثر ۳۰۰ کاراکتر" />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span>اعلان لایک</span>
          <Toggle aria-label="اعلان لایک" checked={on} onChange={setOn} />
        </div>
        <Tabs tabs={[{ id: "a", label: "خرید" }, { id: "b", label: "برداشت" }]} value={tab} onChange={setTab} />
        <ListRow icon={Settings} title="تنظیمات" subtitle="اعلان ها و حریم خصوصی" href="/dashboard/settings" />
      </section>

      <section className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => setDialog(true)}>دیالوگ هشدار</Button>
        <Button variant="secondary" onClick={() => setConfirm(true)}>دیالوگ تایید</Button>
        <Button variant="secondary" onClick={() => setModal(true)}>مودال</Button>
        <Button variant="secondary" onClick={() => setSheet(true)}>شیت</Button>
        <Button variant="secondary" onClick={() => toast("ذخیره شد", "success")}>Toast</Button>
        <Button variant="secondary" onClick={() => toast("خطا در ارتباط", "error")}>Toast خطا</Button>
      </section>

      <AlertModal open={dialog} message="این یک پیام هشدار است" onClose={() => setDialog(false)} />
      <AlertModal open={confirm} variant="error" title="حذف گفتگو" message="مطمئن هستید؟" confirmLabel="حذف کن" onConfirm={() => setConfirm(false)} onClose={() => setConfirm(false)} />
      <Modal open={modal} onClose={() => setModal(false)} title="مودال نمونه">
        <div className="p-6 pt-12 space-y-3">
          <Input label="نام" data-autofocus />
          <Button fullWidth onClick={() => setModal(false)}>تایید</Button>
        </div>
      </Modal>
      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="شیت نمونه">
        <div className="p-5 space-y-3">
          <ListRow title="گزینه اول" onClick={() => setSheet(false)} />
          <ListRow title="حذف" tone="danger" onClick={() => setSheet(false)} />
        </div>
      </BottomSheet>
    </main>
  );
}
