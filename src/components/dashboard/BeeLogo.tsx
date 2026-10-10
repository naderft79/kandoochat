// لوگوی قلب با لانه زنبور — SVG حرفه ای مشکی خالص
type Props = {
  className?: string;
};

export default function BeeLogo({ className }: Props) {
  // تولید شش ضلعی های honeycomb با موقعیت دقیق
  const hex = (cx: number, cy: number, r: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    return `M${pts.join(" L")} Z`;
  };

  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* قلب — منحنی نرم و حرفه ای */}
      <path
        d="M32 57
           C32 57 6 41 6 23
           C6 15 12 9 20 9
           C25 9 29 12 32 16
           C35 12 39 9 44 9
           C52 9 58 15 58 23
           C58 41 32 57 32 57 Z"
        fill="#000"
        stroke="#000"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* الگوی honeycomb — شش ضلعی های منظم */}
      {/* ردیف ۱ — بالا */}
      <path d={hex(32, 17, 4.5)} stroke="#fff" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <path d={hex(23, 21, 4.5)} stroke="#fff" strokeWidth="1.4" fill="none" strokeLinejoin="round" opacity="0.9" />
      <path d={hex(41, 21, 4.5)} stroke="#fff" strokeWidth="1.4" fill="none" strokeLinejoin="round" opacity="0.9" />

      {/* ردیف ۲ — وسط */}
      <path d={hex(28, 25, 4.5)} stroke="#fff" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <path d={hex(36, 25, 4.5)} stroke="#fff" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <path d={hex(19, 29, 4.5)} stroke="#fff" strokeWidth="1.4" fill="none" strokeLinejoin="round" opacity="0.75" />
      <path d={hex(45, 29, 4.5)} stroke="#fff" strokeWidth="1.4" fill="none" strokeLinejoin="round" opacity="0.75" />

      {/* ردیف ۳ */}
      <path d={hex(32, 29, 4.5)} stroke="#fff" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      <path d={hex(24, 33, 4.5)} stroke="#fff" strokeWidth="1.4" fill="none" strokeLinejoin="round" opacity="0.85" />
      <path d={hex(40, 33, 4.5)} stroke="#fff" strokeWidth="1.4" fill="none" strokeLinejoin="round" opacity="0.85" />

      {/* ردیف ۴ — پایین */}
      <path d={hex(29, 37, 4.5)} stroke="#fff" strokeWidth="1.4" fill="none" strokeLinejoin="round" opacity="0.8" />
      <path d={hex(35, 37, 4.5)} stroke="#fff" strokeWidth="1.4" fill="none" strokeLinejoin="round" opacity="0.8" />
      <path d={hex(32, 41, 4)} stroke="#fff" strokeWidth="1.2" fill="none" strokeLinejoin="round" opacity="0.65" />

      {/* نقطه مرکزی — تاکید */}
      <circle cx="32" cy="29" r="1.8" fill="#fff" />
    </svg>
  );
}
