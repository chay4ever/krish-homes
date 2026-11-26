import { Link } from "react-router";
import { useApp } from "@/lib/app";
import { cx } from "@/lib/format";

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="18" fill="#0a5e50" />
      <path d="M14 31 32 15l18 16v19a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2z" fill="#fff" />
      <path d="M26 52V38h12v14" fill="#d4a24c" />
    </svg>
  );
}

export function Logo({ light, className, to = "/" }: { light?: boolean; className?: string; to?: string }) {
  const { brand } = useApp();
  const [a, ...rest] = brand.name.split(" ");
  return (
    <Link to={to} className={cx("flex shrink-0 items-center gap-2 whitespace-nowrap sm:gap-2.5", className)} aria-label={brand.name}>
      <LogoMark size={32} className="shrink-0 sm:size-9" />
      <span className={cx("text-[1.2rem] font-extrabold max-[380px]:text-[1rem] sm:text-[1.35rem] leading-none tracking-tight", light ? "text-white" : "text-ink")}>
        {a}{rest.length > 0 && <span className={light ? "text-gold-300" : "text-brand-600"}> {rest.join(" ")}</span>}
      </span>
    </Link>
  );
}
