// دریافت یا ایجاد شناسه گفتگو با همراه هوش مصنوعی
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getOrCreateAIConversation } from "@/lib/aiCompanion";

export async function POST() {
  try {
    const user = await requireUser();
    const { conversation } = await getOrCreateAIConversation(user.id);
    return NextResponse.json({ conversationId: conversation.id });
  } catch {
    return NextResponse.json({ error: "خطا" }, { status: 500 });
  }
}
