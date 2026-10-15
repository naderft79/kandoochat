// تشخیص چهره با سرویس خودمیزبان (FastAPI + MediaPipe) — endpoint: POST {FACE_DETECTOR_URL}/detect
// پاسخ مورد انتظار: { faces: number, score: number }
// قرارداد: null یعنی «سرویس در دسترس نیست» (fail-closed) — فراخواننده باید عکس را بدون بررسی منتشر نکند
// احراز: هدر Authorization با FACE_SERVICE_TOKEN (در سرویس با مقایسه ثابت-زمان بررسی می شود)

export type FaceResult = {
  faces: number;
  score: number;
  // واریانس لاپلاسین — وضوح عکس؛ هرچه کمتر تارتر (سرویس های قدیمی ممکن است نفرستند)
  sharpness?: number;
};

const TIMEOUT_MS = 15000;

export async function detectFaces(imageBuffer: Buffer, contentType: string): Promise<FaceResult | null> {
  const url = process.env.FACE_DETECTOR_URL;
  const token = process.env.FACE_SERVICE_TOKEN;
  if (!url || !token) return null;

  try {
    // تصویر به صورت خام با Content-Type تصویر ارسال می شود — multipart لازم نیست
    const res = await fetch(`${url.replace(/\/$/, "")}/detect`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": contentType || "image/jpeg",
      },
      body: new Uint8Array(imageBuffer),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      console.error(`[face] detector returned ${res.status}`);
      return null;
    }

    const data = await res.json();
    return {
      faces: typeof data.faces === "number" ? data.faces : 0,
      score: typeof data.score === "number" ? data.score : 0,
    };
  } catch (err) {
    console.error("[face] detector unavailable:", err);
    return null;
  }
}

// نتیجه بررسی محتوای بزرگسال — hits لیست کلاس های رد شده با امتیاز است
export type NsfwResult = {
  nsfw: boolean;
  score: number;
  hits: { class: string; score: number }[];
};

// تشخیص محتوای لخت/سکسی با همان سرویس — endpoint: POST {FACE_DETECTOR_URL}/nsfw
// قرارداد: null یعنی «موتور NSFW نصب/در دسترس نیست» — در آن صورت آپلود متوقف نمی شود
export async function detectNsfw(imageBuffer: Buffer, contentType: string): Promise<NsfwResult | null> {
  const url = process.env.FACE_DETECTOR_URL;
  const token = process.env.FACE_SERVICE_TOKEN;
  if (!url || !token) return null;

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/nsfw`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": contentType || "image/jpeg",
      },
      body: new Uint8Array(imageBuffer),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      if (res.status !== 501) console.error(`[nsfw] detector returned ${res.status}`);
      return null;
    }

    const data = await res.json();
    return {
      nsfw: !!data.nsfw,
      score: typeof data.score === "number" ? data.score : 0,
      hits: Array.isArray(data.hits) ? data.hits : [],
    };
  } catch (err) {
    console.error("[nsfw] detector unavailable:", err);
    return null;
  }
}
