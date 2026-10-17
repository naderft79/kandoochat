"use client";

// لوگوی برند — کندو لوگوی زنبور خودش را دارد؛ برندهای دیگر آیکون متنی تولیدی + نام برند
import { useBrand } from "@/components/BrandProvider";
import KandooLogo from "@/components/KandooLogo";
import Link from "next/link";

export default function BrandLogo({
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
  const brand = useBrand();

  if (brand.id === "kandoo") {
    return (
      <KandooLogo
        href={href}
        className={className}
        iconClassName={iconClassName}
        textClassName={textClassName}
        color={color}
        hideIcon={hideIcon}
      />
    );
  }

  const content = (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`font-extrabold select-none brand-gradient-text ${textClassName || "text-3xl"}`}
      >
        {brand.name}
      </span>
      {!hideIcon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/api/brand-icon/96"
          alt={brand.name}
          width={36}
          height={36}
          className={`shrink-0 ${iconClassName || "w-9 h-9"}`}
          style={{ borderRadius: "var(--brand-radius-card, 12px)" }}
          draggable={false}
        />
      )}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
