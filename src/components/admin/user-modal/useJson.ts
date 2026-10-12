"use client";

// دریافت JSON با وضعیت مشتق از آدرس: بدون setState همزمان در effect (سازگار با قانون react-hooks)
import { useCallback, useEffect, useState } from "react";

export type JsonState<T> = { data: T | undefined; error: string | undefined; loading: boolean; reload: () => void };

export function useJson<T>(url: string | null): JsonState<T> {
  const [state, setState] = useState<{ url: string; data?: T; error?: string } | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!url) return;
    let active = true;
    fetch(url, { cache: "no-store" })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!active) return;
        if (!res.ok) setState({ url, error: (body as { error?: string }).error ?? "خطا در دریافت اطلاعات" });
        else setState({ url, data: body as T });
      })
      .catch(() => {
        if (active) setState({ url, error: "خطا در ارتباط با سرور" });
      });
    return () => {
      active = false;
    };
  }, [url, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const current = state && url && state.url === url ? state : null;
  return { data: current?.data, error: current?.error, loading: !current && !!url, reload };
}
