"use client";

// مدیریت تم — فقط حالت روشن (light)
import { useSyncExternalStore, useCallback } from "react";

type Theme = "light";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): Theme {
  return "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function subscribeMounted(callback: () => void) {
  callback();
  return () => {};
}

function getMountedSnapshot(): boolean {
  return true;
}

function getMountedServerSnapshot(): boolean {
  return false;
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const mounted = useSyncExternalStore(subscribeMounted, getMountedSnapshot, getMountedServerSnapshot);

  const setTheme = useCallback((_t: Theme) => {
    void _t; // همیشه light
  }, []);

  return { theme, resolved: theme, setTheme, mounted };
}

export function ThemeToggle() {
  return (
    <button
      className="w-9 h-9 rounded-xl bg-ig-gray-bg flex items-center justify-center shrink-0 transition-colors"
      title="روشن"
    >
      <svg className="w-4 h-4 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="5" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    </button>
  );
}
