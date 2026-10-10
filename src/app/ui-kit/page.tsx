// صفحه نمونه کتابخانه UI — در production وجود ندارد
import { notFound } from "next/navigation";
import KitClient from "./KitClient";

export default function UiKitPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <KitClient />;
}
