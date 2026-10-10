// خواندن شناسه های ساخته شده توسط scripts/seed-e2e.ts
import * as fs from "fs";
import * as path from "path";

export type E2EData = {
  me: string;
  liked: string;
  plain: string;
  blocked: string;
  noSub: string;
  conversationId: string;
  plainPhone: string;
  mePhone: string;
};

export function e2eData(): E2EData {
  const p = path.join(process.cwd(), "tests", ".e2e-data.json");
  if (!fs.existsSync(p)) throw new Error("Run `npm run e2e:seed` first");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
