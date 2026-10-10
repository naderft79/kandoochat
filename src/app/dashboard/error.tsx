"use client";

import { useEffect } from "react";
import ErrorView from "@/components/ErrorView";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[ui] dashboard error:", error.digest ?? error.message);
  }, [error]);
  return <ErrorView onRetry={reset} />;
}
