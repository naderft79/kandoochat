// آیکون اختصاصی هر ماموریت روزانه بر اساس key — به جای ایموجی
import {
  Coins, UserCheck, MessageCircle, Mic, Image as ImageIcon, Heart,
  CalendarCheck, Eye, UserPlus,
} from "lucide-react";

export const MISSION_ICONS: Record<string, typeof Coins> = {
  daily_new_chats: UserCheck,
  daily_old_chats: MessageCircle,
  daily_voice: Mic,
  daily_photo: ImageIcon,
  daily_likes: Heart,
  // ماموریت های قدیمی — در صورت فعال شدن دوباره از ادمین
  daily_login: CalendarCheck,
  complete_profile: UserCheck,
  send_5_likes: Heart,
  open_10_profiles: Eye,
  start_chat: MessageCircle,
  invite_friend: UserPlus,
};
