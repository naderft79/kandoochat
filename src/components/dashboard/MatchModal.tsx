"use client";

// مودال لایک متقابل: دو آواتار + دکمه شروع گفتگو
import Image from "next/image";
import { Heart } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";

function Face({ src, name }: { src: string | null; name: string }) {
  return (
    <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white bg-ig-btn2">
      {src ? <Image src={src} alt={name} fill sizes="96px" className="object-cover" /> : <DefaultAvatar size={96} />}
    </div>
  );
}

export default function MatchModal({
  open,
  onClose,
  onStartChat,
  starting,
  otherName,
  otherPhoto,
  myPhoto,
}: {
  open: boolean;
  onClose: () => void;
  onStartChat: () => void;
  starting?: boolean;
  otherName: string;
  otherPhoto: string | null;
  myPhoto: string | null;
}) {
  return (
    <Modal open={open} onClose={onClose} title="لایک متقابل" hideClose className="max-w-sm text-center">
      <div className="px-6 pt-8 pb-5">
        <div className="flex items-center justify-center -space-x-5 space-x-reverse mb-5" aria-hidden>
          <Face src={myPhoto} name="شما" />
          <div className="z-10 -mx-3 self-center w-11 h-11 rounded-full bg-surface shadow flex items-center justify-center">
            <Heart className="w-6 h-6 text-ig-like ig-heart-pop" fill="currentColor" />
          </div>
          <Face src={otherPhoto} name={otherName} />
        </div>
        <h2 className="text-xl font-bold text-foreground">لایک متقابل!</h2>
        <p className="text-sm text-ig-gray mt-1.5 leading-6">شما و {otherName} دوطرفه علاقه مند شدید</p>
        <div className="mt-6 space-y-2">
          <Button fullWidth size="lg" onClick={onStartChat} loading={starting} data-autofocus>
            شروع گفتگو
          </Button>
          <Button fullWidth variant="secondary" onClick={onClose}>
            بعدا
          </Button>
        </div>
      </div>
    </Modal>
  );
}
