// استخراج وضعیت فعلی درخواست های سکه از پیام های سیستمی یک گفتگو
// تا کارت درخواست بعد از رفرش هم وضعیت درست (تایید/رد/در انتظار) را نشان بدهد
import { prisma } from "@/lib/prisma";

type MsgLike = { content: string | null; type: string };

export async function getTransferStatuses(messages: MsgLike[]): Promise<Record<string, string>> {
  const ids: string[] = [];
  for (const m of messages) {
    if (m.type !== "SYSTEM" || !m.content) continue;
    try {
      const parsed = JSON.parse(m.content) as { transferId?: string };
      if (parsed.transferId) ids.push(parsed.transferId);
    } catch {
      // محتوای نامعتبر
    }
  }
  if (!ids.length) return {};
  const transfers = await prisma.coinTransfer.findMany({
    where: { id: { in: ids } },
    select: { id: true, status: true },
  });
  return Object.fromEntries(transfers.map((t) => [t.id, t.status]));
}
