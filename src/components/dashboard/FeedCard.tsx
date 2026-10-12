"use client";

// کارت پروفایل کاربر در فید خانه — ساختار مربعی؛ نوار اکشن ♡ · پیام · اشتراک گذاری؛ بدون تاخیر مصنوعی لمس
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  MapPin,
  Ruler,
  Briefcase,
  User,
  X,
} from "lucide-react";
import VerifiedBadge from "@/components/dashboard/VerifiedBadge";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";

import UserActionsSheet from "@/components/dashboard/UserActionsSheet";
import MatchModal from "@/components/dashboard/MatchModal";
import { BottomSheet } from "@/components/ui/Modal";
import Portal from "@/components/ui/Portal";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import { toPersianDigits, formatToman } from "@/lib/format";
import { cn } from "@/components/ui/cn";
import { useLike, useStartChat } from "@/hooks/useProfileActions";
import { useToast } from "@/components/ToastProvider";

export type FeedMatch = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  age: number;
  province?: string;
  city: string;
  job: string | null;
  height: number;
  isVerified: boolean;
  bio: string | null;
  neighborhood: string | null;
  income: number;
  hasStory: boolean;
  liked?: boolean;
  photos: { url: string; order: number; isProfile: boolean }[];
};

export default function FeedCard({
  match,
  isLiked = false,
  myPhoto = null,
  onHidden,
}: {
  match: FeedMatch;
  isLiked?: boolean;
  myPhoto?: string | null;
  onHidden?: (id: string) => void;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const like = useLike(match.id, isLiked);
  const chat = useStartChat(match.id);
  const [bigHeart, setBigHeart] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);
  const lastTap = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (tapTimer.current) clearTimeout(tapTimer.current);
    },
    []
  );

  const profilePhoto = match.photos.find((p) => p.isProfile)?.url ?? null;
  const fullName = `${match.firstName} ${match.lastName}`;

  // دابل تپ روی بدنه کارت = لایک؛ تک تپ روی عکس ها = مودال بزرگ عکس
  function onBodyTap() {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      lastTap.current = 0;
      if (tapTimer.current) {
        clearTimeout(tapTimer.current);
        tapTimer.current = null;
      }
      setBigHeart(true);
      setTimeout(() => setBigHeart(false), 900);
      if (!like.liked) like.like();
      if (navigator.vibrate) navigator.vibrate(15);
    } else {
      lastTap.current = now;
      tapTimer.current = setTimeout(() => {
        tapTimer.current = null;
      }, 260);
    }
  }

  async function share() {
    const url = `${window.location.origin}/profile/${match.username}`;
    try {
      if (navigator.share)
        await navigator.share({ title: `${fullName} در کندو`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("لینک پروفایل کپی شد", "success");
      }
    } catch {
      // اشتراک گذاری لغو شد
    }
  }


  return (
    <article className="ig-fade-in">
      {/* هدر کارت */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setProfileOpen(true)}
          aria-label={`مشاهده ${fullName}`}
          className={`${
            match.hasStory ? "ig-story-ring" : ""
          } active:scale-95 transition-transform shrink-0`}
        >
          <div
            className={`w-9 h-9 rounded-full bg-surface ${
              match.hasStory ? "p-0.5" : ""
            } flex items-center justify-center`}
          >
            {profilePhoto ? (
              <div className="relative w-full h-full rounded-full overflow-hidden">
                <Image
                  src={profilePhoto}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              </div>
            ) : (
              <DefaultAvatar size={32} />
            )}
          </div>
        </button>
        <button
          onClick={() => setProfileOpen(true)}
          className="flex-1 min-w-0 text-start"
        >
          <span className="text-sm font-bold flex items-center gap-1">
            <span className="truncate">{fullName}</span>
            {match.isVerified && <VerifiedBadge className="w-4 h-4 shrink-0" />}
            
          </span>
        </button>
        <IconButton
          aria-label="گزینه های بیشتر"
          onClick={() => setMenuOpen(true)}
          className="-ml-2"
        >
          <MoreHorizontal className="w-6 h-6" aria-hidden />
        </IconButton>
      </div>

      {/* بدنه مربعی */}
      <div
        className="w-full aspect-square max-h-[470px] relative bg-ig-gray-bg select-none flex flex-col overflow-hidden"
        onClick={onBodyTap}
      >
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface/90">
          <MapPin className="w-3.5 h-3.5 text-ig-gray" aria-hidden />
          <span className="text-xs text-foreground font-medium">
            {match.province ? `${match.province}، ` : ""}
            {match.city}
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-8 pt-8 sm:pt-6 pb-2 min-h-0 overflow-hidden">
          {profilePhoto ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPhotoModalUrl(profilePhoto);
              }}
              aria-label={`نمایش عکس ${match.firstName}`}
              className="relative w-24 h-24 sm:w-[150px] sm:h-[150px] rounded-full overflow-hidden mb-2 sm:mb-3 shrink-0"
            >
              <Image
                src={profilePhoto}
                alt=""
                fill
                className="object-cover"
                sizes="150px"
                priority
              />
            </button>
          ) : (
            <DefaultAvatar
              size={96}
              className="mb-2 sm:mb-3 sm:!w-[150px] sm:!h-[150px]"
            />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setProfileOpen(true);
            }}
            className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1 justify-center truncate w-full px-2"
          >
            <span className="truncate">{fullName}</span>
            
          </button>
          {match.bio && (
            <p className="text-sm text-ig-gray mt-1.5 sm:mt-2 max-w-xs leading-6 line-clamp-2">
              {match.bio}
            </p>
          )}
        </div>

        {/* ردیف عکس ها — فقط عکس های واقعی کاربر، بدون آیکن خالی */}
        {match.photos.length > 0 && (
          <div className="flex gap-1 px-3 pb-3 shrink-0">
            {match.photos.slice(0, 3).map((photo, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setPhotoModalUrl(photo.url);
                }}
                aria-label={`عکس ${toPersianDigits(i + 1)} ${match.firstName}`}
                className="relative flex-1 aspect-square rounded-lg overflow-hidden bg-ig-btn2"
              >
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              </button>
            ))}
          </div>
        )}

        {bigHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart
              className="w-24 h-24 text-white ig-double-tap-heart"
              fill="currentColor"
              strokeWidth={1}
              aria-hidden
            />
          </div>
        )}
      </div>

      {/* نوار اکشن ثابت زیر عکس: ♡ · پیام · اشتراک گذاری */}
      <div className="flex items-center justify-center gap-2 px-3 py-2">
        <button
          type="button"
          aria-label={like.liked ? "لایک شد" : "لایک"}
          aria-pressed={like.liked}
          onClick={like.toggle}
          className="flex items-center gap-1.5 h-10 px-4 rounded-lg bg-ig-btn2 text-foreground text-sm font-bold hover:bg-ig-btn2-hover active:scale-95 transition-all"
        >
          <Heart
            className={cn("w-5 h-5", like.liked && "text-ig-like")}
            fill={like.liked ? "currentColor" : "none"}
            strokeWidth={2}
            aria-hidden
          />
          {like.liked ? "لایک شد" : "لایک"}
        </button>
        <button
          type="button"
          onClick={chat.start}
          disabled={chat.loading}
          className="flex items-center gap-1.5 h-10 px-4 rounded-lg bg-ig-blue text-white text-sm font-bold hover:bg-ig-blue-hover active:scale-95 transition-all disabled:opacity-50"
        >
          <MessageCircle className="w-5 h-5" strokeWidth={2} aria-hidden />
          گفتگو
        </button>
        <button
          type="button"
          aria-label="اشتراک گذاری پروفایل"
          onClick={share}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-ig-btn2 text-foreground hover:bg-ig-btn2-hover active:scale-95 transition-all"
        >
          <Send
            className="w-5 h-5 -scale-x-100"
            strokeWidth={2}
            aria-hidden
          />
        </button>
      </div>

      {/* پروفایل کامل کاربر */}
      <BottomSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        title={fullName}
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-ig-btn2 shrink-0">
              {profilePhoto ? (
                <Image
                  src={profilePhoto}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <DefaultAvatar size={80} />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold flex items-center gap-1">
                <span className="truncate">{fullName}</span>
                {match.isVerified && (
                  <VerifiedBadge className="w-5 h-5 shrink-0" />
                )}
                
              </p>
              <p className="text-sm text-ig-gray mt-0.5">
                {toPersianDigits(match.age)} ساله · {match.city}
              </p>
            </div>
          </div>
          {match.bio && (
            <p className="text-sm leading-6 bg-ig-gray-bg rounded-lg p-3">
              {match.bio}
            </p>
          )}
          <ul className="grid grid-cols-2 gap-2 text-sm text-ig-gray">
            {match.height > 0 && (
              <li className="flex items-center gap-2 bg-ig-gray-bg rounded-lg px-3 py-2">
                <Ruler className="w-4 h-4 shrink-0" aria-hidden /> قد{" "}
                {toPersianDigits(match.height)}
              </li>
            )}
            {match.job && (
              <li className="flex items-center gap-2 bg-ig-gray-bg rounded-lg px-3 py-2">
                <Briefcase className="w-4 h-4 shrink-0" aria-hidden />{" "}
                {match.job}
              </li>
            )}
            <li className="flex items-center gap-2 bg-ig-gray-bg rounded-lg px-3 py-2">
              <MapPin className="w-4 h-4 shrink-0" aria-hidden />{" "}
              {match.neighborhood ?? match.city}
            </li>
            {match.income > 0 && (
              <li className="bg-ig-gray-bg rounded-lg px-3 py-2">
                درآمد: {formatToman(match.income)}
              </li>
            )}
          </ul>
          <div className="flex gap-2">
            <Button fullWidth onClick={chat.start} loading={chat.loading}>
              گفتگو
            </Button>
            <Button fullWidth variant="secondary" onClick={like.toggle}>
              {like.liked ? "لایک شد" : "لایک"}
            </Button>
          </div>
          <Link
            href={`/profile/${match.username}`}
            className="block text-center text-sm font-semibold text-ig-blue"
          >
            مشاهده پروفایل کامل
          </Link>
        </div>
      </BottomSheet>

      <UserActionsSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        target={{
          id: match.id,
          username: match.username,
          firstName: match.firstName,
        }}
        onHidden={onHidden}
        onBlocked={onHidden}
      />

      <MatchModal
        open={like.matched}
        onClose={like.clearMatched}
        onStartChat={() => {
          like.clearMatched();
          chat.start();
        }}
        starting={chat.loading}
        otherName={match.firstName}
        otherPhoto={profilePhoto}
        myPhoto={myPhoto}
      />

      {/* مودال بزرگ عکس — مثل بخش جستجو */}
      {photoModalUrl && (
        <Portal>
          <div
            className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 ig-fade-in"
            onClick={() => setPhotoModalUrl(null)}
          >
            <div
              className="relative max-w-sm w-full ig-modal-in"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPhotoModalUrl(null)}
                aria-label="بستن"
                className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-surface ig-shadow-lg flex items-center justify-center active:scale-90 transition-transform"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>

              <div className="rounded-2xl overflow-hidden ig-shadow-lg relative aspect-square">
                <Image
                  src={photoModalUrl}
                  alt={match.firstName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 90vw, 384px"
                  priority
                />

                {/* نام روی عکس */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                  <p className="text-white font-bold text-lg flex items-center gap-1.5">
                    {fullName}
                    {match.isVerified && <VerifiedBadge className="w-5 h-5" />}
                  </p>
                  <p className="text-white/80 text-xs">
                    {toPersianDigits(match.age)} ساله · {match.city}
                  </p>
                </div>

                {/* دکمه ها روی عکس */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2.5 pb-5 justify-end pr-8 pl-4">
                  <button
                    onClick={() => {
                      setPhotoModalUrl(null);
                      chat.start();
                    }}
                    disabled={chat.loading}
                    className="w-11 h-11 rounded-full bg-surface hover:bg-ig-btn2 text-foreground flex items-center justify-center ig-shadow-lg active:scale-90 transition-all disabled:opacity-50"
                    title="گفتگو"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={like.toggle}
                    className="w-11 h-11 rounded-full bg-surface hover:bg-ig-btn2 text-foreground flex items-center justify-center ig-shadow-lg active:scale-90 transition-all"
                    title="لایک"
                  >
                    <Heart
                      className="w-5 h-5"
                      fill={like.liked ? "currentColor" : "none"}
                      strokeWidth={2}
                    />
                  </button>
                  <button
                    onClick={share}
                    className="w-11 h-11 rounded-full bg-surface hover:bg-ig-btn2 text-foreground flex items-center justify-center ig-shadow-lg active:scale-90 transition-all"
                    title="اشتراک گذاری"
                  >
                    <Send className="w-5 h-5 -scale-x-100" />
                  </button>
                  <button
                    onClick={() => router.push(`/profile/${match.username}`)}
                    className="w-11 h-11 rounded-full bg-surface hover:bg-ig-btn2 text-foreground flex items-center justify-center ig-shadow-lg active:scale-90 transition-all"
                    title="مشاهده پروفایل"
                  >
                    <User className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

    </article>
  );
}
