// پرچم کشور به صورت SVG محلی؛ برای کشور نامشخص آیکون کره زمین نشان داده می شود
import { Globe } from "lucide-react";
import { countryNameFa, flagSrc, normalizeCountryCode } from "@/lib/country";

type Props = { code: string | null | undefined; className?: string };

export default function CountryFlag({ code, className = "" }: Props) {
  const normalized = normalizeCountryCode(code);
  const src = flagSrc(normalized);
  const name = countryNameFa(normalized);
  if (!src) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`} title="کشور نامشخص">
        <Globe className="w-3 h-3 text-ig-gray" aria-hidden />
        <span className="sr-only">کشور نامشخص</span>
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`پرچم ${name}`}
      title={name}
      width={20}
      height={15}
      loading="lazy"
      className={`inline-block w-5 h-[15px] rounded-[2px] object-cover shadow-sm ${className}`}
    />
  );
}

// نمایش IP همراه پرچم کشور؛ مدیران کامل IP را می بینند و بقیه فقط کشور را
export function IpCountryBadge({ ip, country, canSeeIp, className = "" }: { ip: string | null; country: string | null; canSeeIp: boolean; className?: string }) {
  const name = countryNameFa(country);
  return (
    <span className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      <CountryFlag code={country} />
      {canSeeIp ? (
        <>
          <bdi dir="ltr">{ip ?? "ثبت نشده"}</bdi>
          {country && <span className="text-[#888]">· {name}</span>}
        </>
      ) : (
        <span>{country ? name : "نامشخص"}</span>
      )}
    </span>
  );
}
