"use client";

// گالری عکس های پروفایل عمومی — گرید چسبیده + لایت باکس با ناوبری
import { useState } from "react";
import Image from "next/image";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import Portal from "@/components/ui/Portal";

export default function PublicGallery({ photos, name }: { photos: { id: string; url: string }[]; name: string }) {
  const [index, setIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;
  const current = index !== null ? photos[index] : null;

  return (
    <>
      <div className="grid grid-cols-3 gap-[2px]">
        {photos.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setIndex(i)}
            className="relative aspect-square overflow-hidden bg-neutral-100"
            aria-label={`بزرگ نمایی عکس ${i + 1}`}
          >
            <Image src={p.url} alt={name} fill className="object-cover" sizes="(max-width: 768px) 33vw, 200px" />
          </button>
        ))}
      </div>

      {/* لایت باکس */}
      {current && (
        <Portal>
        <div
          className="fixed inset-0 z-[90] bg-black/85 flex items-center justify-center"
          onClick={() => setIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="نمایش عکس"
        >
          <button
            onClick={() => setIndex(null)}
            aria-label="بستن"
            className="absolute top-3 left-3 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {index! > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setIndex((i) => (i ?? 1) - 1); }}
              aria-label="عکس قبلی"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
          {index! < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setIndex((i) => (i ?? 0) + 1); }}
              aria-label="عکس بعدی"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
          <div
            className="relative w-full max-w-lg aspect-square"
            onClick={(e) => e.stopPropagation()}
          >
            <Image src={current.url} alt={name} fill className="object-contain" sizes="(max-width: 768px) 100vw, 512px" />
          </div>
        </div>
        </Portal>
      )}
    </>
  );
}
