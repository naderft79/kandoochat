// تشخیص چهره با سرویس محلی متن‌باز — اگر سرویس پیکربندی نشده باشد، null برمی‌گرداند
// سرویس پیشنهادی: یک سرویس Python با insightface / scrfd روی همان VPS
// endpoint: POST {FACE_DETECTOR_URL}/detect — body: image binary یا multipart "image"
// پاسخ مورد انتظار: { faces: number, score: number }

export type FaceResult = {
  faces: number;
  score: number;
};

export async function detectFaces(imageBuffer: Buffer, contentType: string): Promise<FaceResult | null> {
  const url = process.env.FACE_DETECTOR_URL;
  if (!url) return null;

  try {
    const form = new FormData();
    form.append("image", new Blob([new Uint8Array(imageBuffer)], { type: contentType }), "selfie.jpg");

    const res = await fetch(`${url.replace(/\/$/, "")}/detect`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(15000),
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
    console.error("[face] detector error:", err);
    return null;
  }
}
