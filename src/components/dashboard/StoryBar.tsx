"use client";

// استوری بار: نمایش دایره های استوری + آپلود استوری
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Plus, X, Camera, Loader2, Clock, Crown } from "lucide-react";
import DefaultAvatar from "@/components/dashboard/DefaultAvatar";
import VerifiedBadge from "@/components/dashboard/VerifiedBadge";
import dynamic from "next/dynamic";
import AlertModal from "@/components/AlertModal";

// ویرایشگر و نمایشگر استوری فقط هنگام نیاز بارگذاری می شوند
const StoryViewer = dynamic(() => import("@/components/dashboard/StoryViewer"));
const StoryEditor = dynamic(() => import("@/components/dashboard/StoryEditor"));

type StoryItem = {
  id: string;
  url: string;
  type: string;
  caption?: string | null;
  elements?: string | null;
  filter?: string | null;
  createdAt: string;
  viewed: boolean;
  liked?: boolean;
  likeCount?: number;
};

type UserStory = {
  userId: string;
  firstName: string;
  username: string;
  isVerified: boolean;
  isGolden?: boolean;
  photo: string | null;
  stories: StoryItem[];
};

type MyStory = {
  id: string;
  url: string;
  type: string;
  caption?: string | null;
  elements?: string | null;
  filter?: string | null;
  isApproved: boolean;
  createdAt: string;
  viewCount: number;
  likeCount: number;
};

export default function StoryBar({
  currentUserPhoto,
  currentUserFirstName,
  currentUserId,
  hasSubscription,
}: {
  currentUserPhoto: string | null;
  currentUserFirstName: string;
  currentUserId?: string;
  hasSubscription?: boolean;
}) {
  const [myStories, setMyStories] = useState<MyStory[]>([]);
  const [otherStories, setOtherStories] = useState<UserStory[]>([]);
  const [myIsGolden, setMyIsGolden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(-1); // -1 = خود کاربر، 0+ = ایندکس کاربران دیگر
  const [uploading, setUploading] = useState(false);
  const [editorImage, setEditorImage] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStories();
  }, []);

  async function fetchStories() {
    try {
      const res = await fetch("/api/stories");
      if (!res.ok) return;
      const data = await res.json();
      setMyStories(data.myStories || []);
      setOtherStories(data.otherStories || []);
      setMyIsGolden(data.myIsGolden || false);
    } catch {
      // خطای شبکه
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || uploading) return;
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setEditorImage(data.url);
      }
    } catch {
      // خطا
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePublishStory(data: { url: string; elements: string; filter: string }) {
    const storyRes = await fetch("/api/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: data.url, type: "IMAGE", elements: data.elements, filter: data.filter }),
    });
    if (storyRes.ok) {
      await fetchStories();
    } else {
      const errData = await storyRes.json().catch(() => null);
      if (errData?.error) {
        setAlertMsg(errData.error);
      }
    }
    setEditorImage(null);
  }

  function openMyStory() {
    if (myStories.length > 0) {
      setViewerIndex(-1);
      setViewerOpen(true);
    } else if (!hasUnapproved) {
      fileInputRef.current?.click();
    }
  }

  function openUserStory(index: number) {
    setViewerIndex(index);
    setViewerOpen(true);
  }

  // ساخت لیست کامل برای StoryViewer
  const allUserStories: UserStory[] = [
    ...(myStories.length > 0
      ? [{
          userId: "me",
          firstName: currentUserFirstName,
          username: "me",
          isVerified: false,
          photo: currentUserPhoto,
          stories: myStories.map((s) => ({
            id: s.id,
            url: s.url,
            type: s.type,
            caption: s.caption,
            elements: s.elements,
            filter: s.filter,
            createdAt: s.createdAt,
            viewed: true,
            likeCount: s.likeCount,
            isApproved: s.isApproved,
          })),
        }]
      : []),
    ...otherStories,
  ];

  const hasUnapproved = myStories.some((s) => !s.isApproved);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        className="hidden"
      />

      <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 py-2">
        {/* استوری خود کاربر */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <button onClick={openMyStory} className="relative active:scale-95 transition-transform">
            <div
              className={`w-16 h-16 rounded-full p-0.5 flex items-center justify-center ${
                myStories.length > 0 ? (myIsGolden ? "ig-story-ring-golden" : "ig-story-ring") : ""
              }`}
            >
              <div className="w-full h-full rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden">
                {currentUserPhoto ? (
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <Image src={currentUserPhoto} alt={currentUserFirstName} fill className="object-cover" sizes="64px" />
                  </div>
                ) : (
                  <DefaultAvatar size={60} />
                )}
              </div>
            </div>
            <span className={`absolute bottom-0 left-0 w-5 h-5 bg-ig-blue-bright rounded-full border-2 border-white flex items-center justify-center ig-shadow-sm ${hasUnapproved ? "opacity-30" : ""}`}>
              {uploading ? (
                <Loader2 className="w-3 h-3 text-white animate-spin" />
              ) : hasUnapproved ? (
                <Clock className="w-3 h-3 text-ig-gold" />
              ) : (
                <Plus className="w-3 h-3 text-white" strokeWidth={3} />
              )}
            </span>
            {/* نشان در انتظار تایید */}
            {hasUnapproved && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-ig-gold rounded-full border-2 border-white flex items-center justify-center" title="در انتظار تایید">
                <Clock className="w-2.5 h-2.5 text-white" />
              </span>
            )}
          </button>
          <span className="text-xs text-foreground truncate w-16 text-center flex items-center gap-0.5 justify-center">
            شما
            {myIsGolden && <Crown className="w-3 h-3 text-ig-gold shrink-0" fill="currentColor" />}
          </span>
        </div>

        {/* استوری کاربران */}
        {otherStories.map((userStory, idx) => {
          const allViewed = userStory.stories.every((s) => s.viewed);
          return (
            <button
              key={userStory.userId}
              onClick={() => openUserStory(idx)}
              className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform"
            >
              <div className={userStory.isGolden ? "ig-story-ring-golden" : allViewed ? "ig-story-ring-seen" : "ig-story-ring"}>
                <div className="w-16 h-16 rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden">
                  {userStory.photo ? (
                    <div className="relative w-full h-full rounded-full overflow-hidden">
                      <Image src={userStory.photo} alt={userStory.firstName} fill className="object-cover" sizes="64px" />
                    </div>
                  ) : (
                    <DefaultAvatar size={60} />
                  )}
                </div>
              </div>
              <span className="text-xs text-foreground truncate w-16 text-center flex items-center gap-0.5 justify-center">
                {userStory.firstName}
                {userStory.isGolden && <Crown className="w-3 h-3 text-ig-gold shrink-0" fill="currentColor" />}
                {userStory.isVerified && <VerifiedBadge className="w-3 h-3" />}
              </span>
            </button>
          );
        })}

        {/* حالت خالی */}
        {!loading && otherStories.length === 0 && myStories.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-ig-gray px-2">
            <Camera className="w-4 h-4" />
            هنوز استوری ای وجود ندارد
          </div>
        )}
      </div>

      {/* StoryEditor */}
      {editorImage && (
        <StoryEditor
          imageUrl={editorImage}
          onClose={() => setEditorImage(null)}
          onPublish={handlePublishStory}
        />
      )}

      {/* StoryViewer */}
      {viewerOpen && allUserStories.length > 0 && (
        <StoryViewer
          userStories={allUserStories}
          initialIndex={viewerIndex === -1 ? 0 : viewerIndex}
          onClose={() => setViewerOpen(false)}
          onStoriesChange={fetchStories}
          currentUserId={currentUserId}
          hasSubscription={hasSubscription}
        />
      )}

      {/* مودال هشدار عمومی */}
      <AlertModal
        open={alertMsg !== null}
        message={alertMsg ?? ""}
        variant="error"
        onClose={() => setAlertMsg(null)}
      />
    </>
  );
}
