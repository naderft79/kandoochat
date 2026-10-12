import PwaDebug from "@/components/pwa/PwaDebug";

export default function PwaTestPage() {
  return (
    <div className="min-h-dvh bg-surface p-4">
      <h1 className="text-lg font-bold mb-4">PWA Test</h1>
      <PwaDebug />
    </div>
  );
}
