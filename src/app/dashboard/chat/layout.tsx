// چیدمان چت: دسکتاپ دو ستونی (لیست + اتاق)، موبایل تک ستونی
import ChatList from "@/components/dashboard/ChatList";
import ChatShell from "@/components/dashboard/ChatShell";

export default function ChatLayout({ children }: LayoutProps<"/dashboard/chat">) {
  return <ChatShell list={<ChatList />}>{children}</ChatShell>;
}
