import Link from 'next/link';

type BrandProps = {
  className?: string;
  href?: string;
  label?: string;
};

export default function Brand({ className = '', href = '/', label = 'PageFix AI home' }: BrandProps) {
  return (
    <Link href={href} className={`brand-lockup ${className}`.trim()} aria-label={label}>
      <svg className="brand-symbol" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <rect x="2" y="2" width="36" height="36" rx="11" fill="#6d142d" />
        <path d="M12 11h10.4a7.1 7.1 0 0 1 0 14.2H17v5.8h-5V11Z" fill="#fff" />
        <path d="M17 16v4.8h5.4a2.4 2.4 0 0 0 0-4.8H17Z" fill="#c85b79" />
        <path d="m23.2 27.2 3.1 3.1 5.9-6.3" fill="none" stroke="#f5d9b8" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="brand-wordmark">PageFix<small>AI</small></span>
    </Link>
  );
}
