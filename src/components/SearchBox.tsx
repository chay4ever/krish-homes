import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { MapPin, Search } from "lucide-react";
import { Button } from "./ui";
import { useApp } from "@/lib/app";
import { cx, qs } from "@/lib/format";

const TABS = [
  { k: "sale", label: "Buy", params: { type: "sale" } },
  { k: "rent", label: "Rent", params: { type: "rent" } },
  { k: "commercial", label: "Commercial", params: { category: "commercial" } },
  { k: "plot", label: "Plots", params: { category: "plot", type: "sale" } },
] as const;
const BUDGET_SALE = [["", "Any budget"], ["0-5000000", "Under ₹50 L"], ["5000000-10000000", "₹50 L – ₹1 Cr"], ["10000000-20000000", "₹1 – 2 Cr"], ["20000000-", "Above ₹2 Cr"]];
const BUDGET_RENT = [["", "Any budget"], ["0-20000", "Under ₹20K"], ["20000-40000", "₹20K – ₹40K"], ["40000-80000", "₹40K – ₹80K"], ["80000-", "Above ₹80K"]];

export function SearchBox({ className }: { className?: string }) {
  const nav = useNavigate();
  const { cities, localities } = useApp();
  const [tab, setTab] = useState<(typeof TABS)[number]["k"]>("sale");
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [beds, setBeds] = useState("");
  const [budget, setBudget] = useState("");
  const sugg = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return localities.filter((l) => l.name.toLowerCase().includes(t)).slice(0, 5).map((l) => ({ l, city: cities.find((c) => c.id === l.city_id) }));
  }, [q, localities, cities]);

  const go = (override?: { city?: string; locality?: string }) => {
    const t = TABS.find((x) => x.k === tab)!;
    const [min, max] = budget.split("-");
    nav("/search" + qs({ ...(t.params as Record<string, string>), city: override?.city ?? city, locality: override?.locality, q: override?.locality ? "" : q.trim(), beds, min, max }));
  };
  const showBeds = tab === "sale" || tab === "rent";
  const budgets = tab === "rent" || tab === "commercial" ? BUDGET_RENT : BUDGET_SALE;

  return (
    <div className={cx("rounded-[28px] bg-white p-3 shadow-lift sm:p-4", className)}>
      <div className="no-scrollbar relative mb-3 flex gap-1 overflow-x-auto rounded-2xl bg-surface p-1">
        {TABS.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={cx("relative flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition", tab === t.k ? "text-white" : "text-ink-2")}>
            {tab === t.k && <motion.span layoutId="hero-tab" className="absolute inset-0 rounded-xl bg-brand-700" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); go(); }} className="grid grid-cols-2 gap-2.5 lg:grid-cols-[180px_1fr_150px_170px_auto]">
        <div className="relative col-span-2 lg:col-span-1">
          <MapPin size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-600" />
          <select className="input !pl-10" value={city} onChange={(e) => setCity(e.target.value)} aria-label="City">
            <option value="">All cities</option>
            {cities.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div className="relative col-span-2 lg:col-span-1">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input className="input !pl-10" placeholder="Locality, project or landmark" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          {sugg.length > 0 && (
            <div className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-lift">
              {sugg.map(({ l, city: c }) => (
                <button type="button" key={l.id} onClick={() => go({ city: c?.slug, locality: l.slug })} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-brand-50">
                  <MapPin size={15} className="text-brand-600" /><b>{l.name}</b><span className="text-ink-3">{c?.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <select className="input" value={showBeds ? beds : ""} disabled={!showBeds} onChange={(e) => setBeds(e.target.value)} aria-label="Bedrooms">
          <option value="">Any BHK</option>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n === 4 ? "4+ BHK" : `${n} BHK`}</option>)}
        </select>
        <select className="input" value={budget} onChange={(e) => setBudget(e.target.value)} aria-label="Budget">
          {budgets.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <Button type="submit" size="lg" className="col-span-2 lg:col-span-1 lg:px-8"><Search size={19} /> Search</Button>
      </form>
    </div>
  );
}
