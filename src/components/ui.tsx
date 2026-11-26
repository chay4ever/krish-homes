import { useEffect, type ButtonHTMLAttributes, type ReactNode, type InputHTMLAttributes } from "react";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { Loader2, X } from "lucide-react";
import { cx } from "@/lib/format";
import { useLockScroll, useMedia } from "@/lib/hooks";

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "dark" | "outline" | "ghost" | "gold" | "danger" | "soft"; size?: "sm" | "md" | "lg"; loading?: boolean; full?: boolean };
export function Button({ variant = "primary", size = "md", loading, full, className, children, disabled, ...p }: BtnProps) {
  const v = {
    primary: "bg-brand-700 text-white hover:bg-brand-800 shadow-[0_8px_20px_-8px_rgb(10_94_80/0.6)]",
    dark: "bg-ink text-white hover:bg-black",
    gold: "bg-gold-400 text-ink hover:bg-gold-300 shadow-[0_8px_20px_-8px_rgb(212_162_76/0.7)]",
    outline: "border-[1.5px] border-line bg-white text-ink hover:border-brand-500 hover:text-brand-700",
    soft: "bg-brand-50 text-brand-800 hover:bg-brand-100",
    ghost: "text-ink-2 hover:bg-black/5",
    danger: "bg-danger text-white hover:opacity-90",
  }[variant];
  const s = { sm: "h-9 px-3.5 text-sm rounded-xl", md: "h-11 px-5 text-[15px] rounded-2xl", lg: "h-[52px] px-7 text-base rounded-2xl" }[size];
  return (
    <button {...p} disabled={disabled || loading}
      className={cx("inline-flex select-none items-center justify-center gap-2 font-semibold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-55", v, s, full && "w-full", className)}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Field({ label, hint, error, children, className }: { label?: string; hint?: string; error?: string | null; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      {label && <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-3">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-danger">{error}</span>}
    </label>
  );
}
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx("input", p.className)} />;

export function Chip({ active, children, onClick, className }: { active?: boolean; children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick}
      className={cx("inline-flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-2 text-sm font-semibold transition active:scale-95",
        active ? "border-brand-700 bg-brand-700 text-white" : "border-line bg-white text-ink-2 hover:border-brand-400", className)}>
      {children}
    </button>
  );
}

export function Badge({ children, tone = "brand", className }: { children: ReactNode; tone?: "brand" | "gold" | "ink" | "red" | "gray" | "green"; className?: string }) {
  const t = { brand: "bg-brand-50 text-brand-800", gold: "bg-gold-100 text-gold-600", ink: "bg-ink text-white", red: "bg-red-50 text-red-700", gray: "bg-black/5 text-ink-2", green: "bg-emerald-50 text-emerald-700" }[tone];
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide", t, className)}>{children}</span>;
}

export const Skeleton = ({ className }: { className?: string }) => <div className={cx("skeleton", className)} />;

export function Spinner({ className }: { className?: string }) { return <Loader2 className={cx("animate-spin text-brand-600", className)} />; }

export function Empty({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-14 text-center">
      {icon && <div className="mb-4 grid size-16 place-items-center rounded-3xl bg-brand-50 text-brand-700">{icon}</div>}
      <h3 className="text-lg font-bold">{title}</h3>
      {text && <p className="mt-1.5 text-sm text-ink-3">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Responsive overlay: bottom sheet (drag to dismiss) on mobile, centred dialog on desktop. */
export function Sheet({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const desktop = useMedia("(min-width: 768px)");
  const drag = useDragControls();
  useLockScroll(open);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center md:p-6">
          <motion.div className="absolute inset-0 bg-ink/55 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div role="dialog" aria-modal="true"
            className={cx("relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-white shadow-2xl rounded-t-[28px] md:rounded-[28px]", wide ? "md:max-w-2xl" : "md:max-w-md")}
            initial={desktop ? { opacity: 0, scale: 0.96, y: 12 } : { y: "100%" }} animate={desktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }} exit={desktop ? { opacity: 0, scale: 0.97 } : { y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
            drag={desktop ? false : "y"} dragControls={drag} dragListener={false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => { if (i.offset.y > 120 || i.velocity.y > 600) onClose(); }}>
            <div className="flex shrink-0 touch-none flex-col items-center pt-2.5 md:hidden" onPointerDown={(e) => drag.start(e)}>
              <div className="h-1.5 w-11 rounded-full bg-black/15" />
            </div>
            {(title || desktop) && (
              <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-3 md:pt-5" onPointerDown={(e) => !desktop && drag.start(e)}>
                <h2 className="text-lg font-extrabold">{title}</h2>
                <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full bg-black/5 transition hover:bg-black/10 active:scale-90"><X size={18} /></button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
            {footer && <div className="shrink-0 border-t border-line bg-white px-5 pb-[calc(1rem+var(--safe-b))] pt-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function SectionHead({ title, sub, action, dark }: { title: string; sub?: string; action?: ReactNode; dark?: boolean }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 sm:mb-6">
      <div>
        <h2 className={cx("font-display text-[1.65rem] font-semibold leading-tight sm:text-4xl", dark && "text-white")}>{title}</h2>
        {sub && <p className={cx("mt-1 text-sm sm:text-base", dark ? "text-white/60" : "text-ink-3")}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, icon, tone = "brand" }: { label: string; value: ReactNode; icon?: ReactNode; tone?: "brand" | "gold" | "ink" }) {
  const t = { brand: "bg-brand-50 text-brand-700", gold: "bg-gold-100 text-gold-600", ink: "bg-ink/5 text-ink" }[tone];
  return (
    <div className="rounded-3xl border border-line bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-center justify-between"><span className="text-[13px] font-semibold text-ink-3">{label}</span>{icon && <span className={cx("grid size-9 place-items-center rounded-xl", t)}>{icon}</span>}</div>
      <div className="mt-2 text-3xl font-extrabold tabular">{value}</div>
    </div>
  );
}
