import Link from "next/link";
import Image from "next/image";

/**
 * لوگوی کندو به همراه تایپوگرافی kandoo
 * آیکن زنبور از تصویر PNG آپلود شده توسط کاربر استفاده می کند.
 * قابل استفاده در هدر لندینگ و سایدبار دسکتاپ
 */
export default function KandooLogo({
  href,
  className = "",
  iconClassName = "",
  textClassName = "",
  color = false,
  hideIcon = false,
}: {
  href?: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  color?: boolean;
  hideIcon?: boolean;
}) {
  const logoSrc = color ? "/bee-colori-logo.png" : "/bee-gray-logo.png";
  const content = (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* تایپوگرافی KanDoo */}
      <span
        className={`font-[family-name:var(--font-grand-hotel)] text-foreground tracking-wide select-none ${
          textClassName || "text-3xl"
        }`}
      >
        KanDoo
      </span>

      {/* آیکن زنبور — PNG بدون فشرده‌سازی، کیفیت کامل */}
      {!hideIcon && (
        <Image
          src={logoSrc}
          alt="KanDoo"
          width={36}
          height={36}
          className={`shrink-0 ${iconClassName || "w-9 h-9"}`}
          draggable={false}
          priority
        />
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
