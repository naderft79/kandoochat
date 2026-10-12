// تشخیص چهره با سرویس خودمیزبان (FastAPI + MediaPipe) — endpoint: POST {FACE_DETECTOR_URL}/detect
// پاسخ مورد انتظار: { faces: number, score: number }
// قرارداد: null یعنی «سرویس در دسترس نیست» (fail-closed) — فراخواننده باید عکس را بدون بررسی منتشر نکند
// احراز: هدر Authorization با FACE_SERVICE_TOKEN (در سرویس با مقایسه ثابت-زمان بررسی می شود)

export type FaceResult = {
  faces: number;
  score: number;
};

const TIMEOUT_MS = 15000;

export async function detectFaces(imageBuffer: Buffer, contentType: string): Promise<FaceResult | null> {
  const url = process.env.FACE_DETECTOR_URL;
  const token = process.env.FACE_SERVICE_TOKEN;
  if (!url || !token) return null;

  try {
    const form = new FormData();
    form.append("image", new Blob([new Uint8Array(imageBuffer)], { type: contentType }), "selfie.jpg");

    const res = await fetch(`${url.replace(/\/$/, "")}/detect`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
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
