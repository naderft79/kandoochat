"use client";

// مدیریت تم دارک/روشن پنل ادمین
import { useState, useEffect, useCallback } from "react";
import { Sun, Moon } from "lucide-react";

export default function AdminThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("admin-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("admin-theme", dark ? "dark" : "light");
  }, [dark, mounted]);

  const toggle = useCallback(() => setDark((d) => !d), []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-[#888] hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.08)] transition-colors"
      title={dark ? "حالت روشن" : "حالت تاریک"}
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
