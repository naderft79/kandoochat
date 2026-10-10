// API سریع موجودی سکه — برای polling در سربرگ
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureWallet } from "@/lib/finance";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wallet = await ensureWallet(user.id);
  return NextResponse.json({ balance: wallet.balance });
}
