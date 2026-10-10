// اسکلتون های صفحه با شکل واقعی محتوا برای loading.tsx
import { Skeleton } from "@/components/dashboard/Skeleton";

function HeaderSkeleton() {
  return (
    <div className="h-14 md:h-16 px-4 flex items-center justify-between border-b border-ig-border">
      <Skeleton className="w-24 h-9 rounded-full" />
      <Skeleton className="w-24 h-5" />
      <Skeleton className="w-8 h-8 rounded-full" />
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری">
      <HeaderSkeleton />
      <div className="max-w-[470px] mx-auto">
        <div className="flex gap-3 px-3 py-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="w-12 h-3" />
            </div>
          ))}
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="mb-4">
            <div className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="w-9 h-9 rounded-full" />
              <Skeleton className="w-32 h-4" />
            </div>
            <Skeleton className="w-full aspect-square rounded-none" />
            <div className="px-4 py-3 space-y-2">
              <Skeleton className="w-24 h-5" />
              <Skeleton className="w-2/3 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری">
      <HeaderSkeleton />
      <div className="grid grid-cols-3 gap-0.5 p-0.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-none" />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 8, header = true }: { rows?: number; header?: boolean }) {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری">
      {header && <HeaderSkeleton />}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="w-14 h-14 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-1/3 h-4" />
            <Skeleton className="w-2/3 h-3" />
          </div>
          <Skeleton className="w-10 h-3" />
        </div>
      ))}
    </div>
  );
}

export function ChatRoomSkeleton() {
  return (
    <div className="flex flex-col h-full" aria-busy="true" aria-label="در حال بارگذاری">
      <div className="flex items-center gap-3 px-3 py-3 border-b border-ig-border">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="w-28 h-4" />
          <Skeleton className="w-20 h-3" />
        </div>
      </div>
      <div className="flex-1 p-4 space-y-3">
        <Skeleton className="w-2/3 h-12 rounded-3xl mr-auto" />
        <Skeleton className="w-1/2 h-12 rounded-3xl" />
        <Skeleton className="w-3/5 h-12 rounded-3xl mr-auto" />
      </div>
      <div className="p-3 border-t border-ig-border">
        <Skeleton className="w-full h-11 rounded-full" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری">
      <HeaderSkeleton />
      <div className="max-w-[600px] mx-auto p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1 grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </div>
        <Skeleton className="w-1/2 h-5" />
        <Skeleton className="w-full h-4" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <div className="grid grid-cols-3 gap-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-none" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری">
      <HeaderSkeleton />
      <div className="max-w-[600px] mx-auto p-4 space-y-4">
        <Skeleton className="w-full h-40 rounded-xl" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
