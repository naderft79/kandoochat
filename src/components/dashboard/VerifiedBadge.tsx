// تیک تایید یکپارچه — در همه جای سایت از این کامپوننت استفاده شود
import { BadgeCheck } from "lucide-react";

type Props = {
  className?: string;
};

// رنگ: آبی روشن اینستاگرام (#0095F6) با مرز سفید؛ سایز پیش فرض w-4 h-4
export default function VerifiedBadge({ className = "w-4 h-4" }: Props) {
  return <BadgeCheck className={className} fill="#0095F6" stroke="white" strokeWidth={2} role="img" aria-label="تایید شده" />;
}
