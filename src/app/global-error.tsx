"use client";

// خطای سطح ریشه (وقتی layout اصلی هم خطا بدهد) — بدون وابستگی به providerها
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fa" dir="rtl">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div role="alert" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 20, margin: "0 0 8px", color: "#262626" }}>مشکلی پیش آمد</h1>
          <p style={{ fontSize: 14, color: "#737373", margin: "0 0 20px" }}>لطفا دوباره تلاش کنید.</p>
          <button
            onClick={reset}
            style={{ height: 40, padding: "0 20px", border: 0, borderRadius: 8, background: "#0074C7", color: "#fff", fontWeight: 600, fontSize: 14 }}
          >
            تلاش مجدد
          </button>
        </div>
      </body>
    </html>
  );
}
