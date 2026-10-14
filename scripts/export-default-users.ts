// خروجی کاربران فیک پیش فرض: JSON پروفایل + عکس پروفایل در public/uploads/default-users
// و حذف عکس های گالری از دیتابیس. پیش فرض dry-run است؛ با --apply واقعاً اعمال می شود.
import "dotenv/config";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/prisma";

const apply = process.argv.includes("--apply");
const root = process.cwd();
const publicDir = path.join(root, "public");
const photoDirUrl = "/uploads/default-users";
const photoDir = path.join(publicDir, "uploads", "default-users");
const outFile = path.join(root, "prisma", "seed-data", "default-users.json");

async function main() {
  // ریشه و همراه های هوش مصنوعی عمداً جدا می مانند
  const users = await prisma.user.findMany({
    where: { phone: { not: "1" }, isAICompanion: false, isAdminProfile: false },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      phone: true,
      username: true,
      gender: true,
      firstName: true,
      lastName: true,
      province: true,
      city: true,
      age: true,
      height: true,
      weight: true,
      income: true,
      carModel: true,
      neighborhood: true,
      job: true,
      bio: true,
      isVerified: true,
      isIdentityVerified: true,
      isSpecial: true,
      wallet: { select: { balance: true } },
      interests: { select: { interest: { select: { name: true, icon: true } } } },
      photos: { select: { id: true, url: true, isProfile: true, order: true }, orderBy: { order: "asc" } },
    },
  });

  const entries = [];
  const profileMoves: Array<{ id: string; url: string }> = [];
  let galleryCount = 0;
  let noProfile = 0;

  for (const u of users) {
    const profile = u.photos.find((p) => p.isProfile);
    galleryCount += u.photos.filter((p) => !p.isProfile).length;
    let photo: string | null = null;
    if (profile) {
      const ext = path.extname(profile.url) || ".jpg";
      const fileName = `${u.phone}${ext}`;
      photo = `${photoDirUrl}/${fileName}`;
      profileMoves.push({ id: profile.id, url: photo });
      if (apply) {
        mkdirSync(photoDir, { recursive: true });
        copyFileSync(path.join(publicDir, profile.url), path.join(photoDir, fileName));
      }
    } else {
      noProfile++;
    }
    entries.push({
      phone: u.phone,
      username: u.username,
      gender: u.gender,
      firstName: u.firstName,
      lastName: u.lastName,
      province: u.province,
      city: u.city,
      age: u.age,
      height: u.height,
      weight: u.weight,
      income: u.income,
      carModel: u.carModel,
      neighborhood: u.neighborhood,
      job: u.job,
      bio: u.bio,
      isVerified: u.isVerified,
      isIdentityVerified: u.isIdentityVerified,
      isSpecial: u.isSpecial,
      walletBalance: u.wallet?.balance ?? 0,
      interests: u.interests.map((i) => ({ name: i.interest.name, icon: i.interest.icon })),
      profilePhoto: photo,
    });
  }

  console.log(`[export] users: ${entries.length}, profile photos: ${profileMoves.length}, users without photo: ${noProfile}, gallery rows to delete: ${galleryCount}`);

  if (!apply) {
    console.log("[export] dry-run only. Re-run with --apply to write files and update the database.");
    return;
  }

  mkdirSync(path.dirname(outFile), { recursive: true });
  writeFileSync(outFile, JSON.stringify(entries, null, 2) + "\n");
  console.log(`[export] wrote ${outFile}`);

  const galleryIds = users.flatMap((u) => u.photos.filter((p) => !p.isProfile).map((p) => p.id));
  const deleted = await prisma.profilePhoto.deleteMany({ where: { id: { in: galleryIds } } });
  console.log(`[export] deleted gallery rows: ${deleted.count}`);

  for (const m of profileMoves) {
    await prisma.profilePhoto.update({ where: { id: m.id }, data: { url: m.url, isVerified: true, isRejected: false, isDeletedByUser: false } });
  }
  console.log(`[export] profile photos re-pointed: ${profileMoves.length}`);

  const fakeResult = await prisma.user.updateMany({
    where: { id: { in: users.map((u) => u.id) } },
    data: { isFake: true },
  });
  console.log(`[export] marked isFake: ${fakeResult.count}`);
}

main()
  .catch((err) => {
    console.error("[export] failed:", err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
