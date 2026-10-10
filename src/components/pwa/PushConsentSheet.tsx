"use client";

// شیت درخواست مجوز اعلان — یک بار پس از اولین رویداد مهم (لایک/پیام) نمایش داده می شود
import { useEffect, useRef, useState } from "react";
import { BellRing } from "lucide-react";
import { BottomSheet } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useLiveData } from "@/components/dashboard/LiveDataProvider";

const ASKED_KEY = "kandoo-push-asked";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function subscribePush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
  } catch (err) {
    console.error("[PWA] push subscribe failed:", err);
  }
}

export default function PushConsentSheet() {
  const { unreadCount, unreadConversations } = useLiveData();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const askedRef = useRef(false);

  useEffect(() => {
    if (askedRef.current) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(ASKED_KEY)) return;
    // فقط وقتی اولین رویداد مهم رسیده (اعلان یا پیام نخوانده) شیت نشان داده می شود
    if (unreadCount === 0 && unreadConversations === 0) return;

    askedRef.current = true;
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [unreadCount, unreadConversations]);

  function dismiss() {
    localStorage.setItem(ASKED_KEY, "1");
    setOpen(false);
  }

  async function accept() {
    setBusy(true);
    localStorage.setItem(ASKED_KEY, "1");
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") await subscribePush();
    } catch {
      // مرورگر اجازه نداد
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={dismiss} title="اعلان ها را روشن کنید">
      <div className="px-5 pb-6 text-center">
        <div className="w-16 h-16 rounded-full bg-ig-gray-bg flex items-center justify-center mx-auto mb-4">
          <BellRing className="w-8 h-8 text-foreground" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-ig-gray leading-6 mb-5">
          برای اینکه لایک ها، پیام ها و هدیه هایتان را از دست ندهید، اعلان ها را فعال کنید.
        </p>
        <div className="space-y-2">
          <Button fullWidth onClick={accept} loading={busy}>
            روشن کنید
          </Button>
          <button onClick={dismiss} className="w-full h-11 text-sm text-ig-gray">
            فعلا نه
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
