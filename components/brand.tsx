import Link from 'next/link';

type BrandProps = {
  className?: string;
  href?: string;
  label?: string;
};

export default function Brand({ className = '', href = '/', label = 'PageFix AI home' }: BrandProps) {
  return (
    <Link href={href} className={`brand-lockup ${className}`.trim()} aria-label={label}>
      <svg className="brand-symbol" viewBox="0 0 48 48" role="img" aria-label="PageFix symbol" focusable="false">
        <defs>
          <linearGradient id="pagefix-mark-gradient" x1="4" y1="3" x2="44" y2="46" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8F1D3D" />
            <stop offset="1" stopColor="#4B0D20" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#pagefix-mark-gradient)" />
        <path d="M14 35V13h11.2c6.1 0 9.8 3.2 9.8 8.5S31.3 30 25.2 30H20v5h-6Zm6-10h5c2.7 0 4-1.1 4-3.4s-1.3-3.5-4-3.5h-5V25Z" fill="#FFF8FA" />
        <path d="M34.5 32.5v-5.8M38.5 32.5v-9M42.5 32.5v-12" stroke="#F2C3D0" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="38.5" cy="16" r="1.8" fill="#F5D9B8" />
      </svg>
      <span className="brand-wordmark">PageFix<small>AI</small></span>
    </Link>
  );
}
