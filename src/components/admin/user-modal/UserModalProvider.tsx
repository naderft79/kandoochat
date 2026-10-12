"use client";

// پشته ناوبری مودال پروفایل کاربر: از هر اسم کاربر در پنل باز می شود و دکمه بازگشت به کاربر قبلی برمی گردد
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import UserModal from "@/components/admin/user-modal/UserModal";

const MAX_DEPTH = 20;

type UserModalContextValue = {
  open: (userId: string) => void;
  back: () => void;
  close: () => void;
  depth: number;
};

// بیرون از Provider هیچ کاری نمی کند (امن برای کامپوننت های ساده)
const noop: UserModalContextValue = { open: () => {}, back: () => {}, close: () => {}, depth: 0 };
const UserModalContext = createContext<UserModalContextValue>(noop);

export function useUserModal(): UserModalContextValue {
  return useContext(UserModalContext);
}

export default function UserModalProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<string[]>([]);

  const open = useCallback((userId: string) => {
    setStack((prev) => (prev[prev.length - 1] === userId ? prev : [...prev.slice(-(MAX_DEPTH - 1)), userId]));
  }, []);
  const back = useCallback(() => setStack((prev) => prev.slice(0, -1)), []);
  const close = useCallback(() => setStack([]), []);

  const value = useMemo<UserModalContextValue>(() => ({ open, back, close, depth: stack.length }), [open, back, close, stack.length]);
  const current = stack[stack.length - 1] ?? null;

  return (
    <UserModalContext.Provider value={value}>
      {children}
      {current && <UserModal userId={current} depth={stack.length} onBack={back} onClose={close} />}
    </UserModalContext.Provider>
  );
}
