import { User } from "lucide-react";

type Props = {
  size?: number;
  className?: string;
};

// آواتار پیش فرض — دایره خاکستری روشن با آیکون خاکستری (مثل اینستاگرام)
export default function DefaultAvatar({ size = 48, className = "" }: Props) {
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-ig-btn2 text-ig-gray shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <User
        strokeWidth={1.5}
        style={{ width: size * 0.5, height: size * 0.5, transform: "translateY(-2%)" }}
      />
    </div>
  );
}
