"use client";

// پورتال به body — هر اورلی fixed باید داخل پورتال رندر شود تا در stacking context
// والد (کارت فید، انیمیشن، backdrop-filter و ...) گرفتار نشود و زیر محتوای بعدی نرود
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

export default function Portal({ children }: { children: ReactNode }) {
  return typeof document === "undefined" ? null : createPortal(children, document.body);
}
