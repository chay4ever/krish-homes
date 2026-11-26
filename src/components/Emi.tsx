import { useState } from "react";
import { emi, inr, cx } from "@/lib/format";

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; fmt: (n: number) => string }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-ink-2">{label}</span><span className="rounded-xl bg-brand-50 px-3 py-1 text-sm font-extrabold text-brand-800 tabular">{fmt(value)}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label}
        className="h-2 w-full cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand-700 [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand-700 [&::-webkit-slider-thumb]:shadow-lg"
        style={{ background: `linear-gradient(to right, var(--color-brand-600) ${pct}%, #e5e8e3 ${pct}%)` }} />
    </div>
  );
}

export function EmiCalculator({ price = 8000000, compact }: { price?: number; compact?: boolean }) {
  const [amount, setAmount] = useState(Math.round((price * 0.8) / 100000) * 100000 || 5000000);
  const [rate, setRate] = useState(8.75);
  const [years, setYears] = useState(20);
  const m = emi(amount, rate, years);
  const total = m * years * 12;
  const interest = total - amount;
  const r = 52; const c = 2 * Math.PI * r; const pPct = amount / total;
  return (
    <div className={cx("grid gap-6", !compact && "md:grid-cols-[1fr_auto] md:items-center md:gap-10")}>
      <div className="space-y-6">
        <Slider label="Loan amount" value={amount} min={500000} max={Math.max(100000000, amount)} step={100000} onChange={setAmount} fmt={(n) => inr(n)} />
        <Slider label="Interest rate (p.a.)" value={rate} min={6} max={16} step={0.05} onChange={setRate} fmt={(n) => n.toFixed(2) + "%"} />
        <Slider label="Tenure" value={years} min={1} max={30} step={1} onChange={setYears} fmt={(n) => n + " yrs"} />
      </div>
      <div className={cx("flex items-center gap-5 rounded-3xl bg-brand-50/70 p-5", compact ? "flex-row" : "flex-col sm:flex-row md:flex-col lg:flex-row")}>
        <div className="relative size-36 shrink-0">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90">
            <circle cx="60" cy="60" r={r} fill="none" stroke="#d4a24c" strokeWidth="14" />
            <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-brand-700)" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${c * pPct} ${c}`} style={{ transition: "stroke-dasharray .4s" }} />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center"><div><div className="text-[11px] font-bold uppercase text-ink-3">Monthly EMI</div><div className="text-lg font-extrabold tabular">₹{Math.round(m).toLocaleString("en-IN")}</div></div></div>
        </div>
        <dl className="space-y-3 text-sm">
          <div><dt className="flex items-center gap-2 text-ink-3"><i className="size-2.5 rounded-full bg-brand-700" />Principal</dt><dd className="font-extrabold tabular">{inr(amount)}</dd></div>
          <div><dt className="flex items-center gap-2 text-ink-3"><i className="size-2.5 rounded-full bg-gold-400" />Total interest</dt><dd className="font-extrabold tabular">{inr(interest)}</dd></div>
          <div><dt className="text-ink-3">Total payable</dt><dd className="font-extrabold tabular">{inr(total)}</dd></div>
        </dl>
      </div>
    </div>
  );
}
