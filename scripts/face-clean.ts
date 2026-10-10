// پاکسازی عکس های بدون چهره از دیتابیس
// اجرا: npx tsx scripts/face-clean.ts          (حذف واقعی)
//       npx tsx scripts/face-clean.ts --dry    (فقط گزارش بدون حذف)
import "dotenv/config";
import path from "path";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { prisma } from "../src/lib/prisma";
import { detectFaces } from "../src/lib/face";
import { deleteFile } from "../src/lib/storage";

const DRY_RUN = process.argv.includes("--dry");

async function main() {
  if (!process.env.FACE_DETECTOR_URL) {
    console.error("[face-clean] FACE_DETECTOR_URL is not set — aborting");
    process.exit(1);
  }

  const photos = await prisma.profilePhoto.findMany({
    select: { id: true, url: true, userId: true, isProfile: true, isDeletedByUser: true },
  });
  console.log(`[face-clean] total photos: ${photos.length} (dry=${DRY_RUN})`);

  let ok = 0;
  let noFace = 0;
  let missing = 0;
  let error = 0;

  for (const photo of photos) {
    if (!photo.url.startsWith("/uploads/")) {
      console.log(`[face-clean] skip external url: ${photo.url}`);
      continue;
    }
    const filePath = path.join(process.cwd(), "public", photo.url);
    if (!existsSync(filePath)) {
      console.log(`[face-clean] MISSING file, deleting row: ${photo.id} ${photo.url}`);
      missing++;
      if (!DRY_RUN) {
        await prisma.profilePhoto.delete({ where: { id: photo.id } });
      }
      continue;
    }

    const buffer = await readFile(filePath);
    const ext = path.extname(photo.url).slice(1).toLowerCase();
    const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    const result = await detectFaces(buffer, mime);

    if (result === null) {
      console.error(`[face-clean] detector error for ${photo.id} — keeping`);
      error++;
      continue;
    }

    if (result.faces === 0) {
      console.log(`[face-clean] NO FACE -> delete: ${photo.id} user=${photo.userId.slice(0, 8)} profile=${photo.isProfile} ${photo.url}`);
      noFace++;
      if (!DRY_RUN) {
        await prisma.profilePhoto.delete({ where: { id: photo.id } });
        await deleteFile(photo.url);
      }
    } else {
      ok++;
    }
  }

  console.log(`[face-clean] done — kept: ${ok}, noFace deleted: ${noFace}, missing deleted: ${missing}, errors kept: ${error}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
