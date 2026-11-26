import { useMemo } from "react";
import { Chip } from "./ui";
import { useApp } from "@/lib/app";
import { PROPERTY_TYPES, FURNISHING } from "../../shared/constants";
import { cx } from "@/lib/format";

export type Params = URLSearchParams;
type SetFn = (patch: Record<string, string | undefined | null>) => void;

const SALE_BUDGETS: [string, string, string][] = [["Under ₹50 L", "", "5000000"], ["₹50 L – 1 Cr", "5000000", "10000000"], ["₹1 – 2 Cr", "10000000", "20000000"], ["₹2 – 5 Cr", "20000000", "50000000"], ["Above ₹5 Cr", "50000000", ""]];
const RENT_BUDGETS: [string, string, string][] = [["Under ₹15K", "", "15000"], ["₹15K – 30K", "15000", "30000"], ["₹30K – 60K", "30000", "60000"], ["₹60K – 1.2L", "60000", "120000"], ["Above ₹1.2L", "120000", ""]];

const toggleIn = (csv: string | null, v: string) => {
  const a = (csv ?? "").split(",").filter(Boolean);
  const n = a.includes(v) ? a.filter((x) => x !== v) : [...a, v];
  return n.length ? n.join(",") : undefined;
};

export function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="border-b border-line py-5 first:pt-0 last:border-0"><h4 className="mb-3 text-sm font-extrabold">{title}</h4>{children}</div>;
}

export function FilterPanel({ params, set }: { params: Params; set: SetFn }) {
  const { cities, localities } = useApp();
  const type = params.get("type"); const category = params.get("category");
  const city = cities.find((c) => c.slug === params.get("city"));
  const cityLocs = useMemo(() => (city ? localities.filter((l) => l.city_id === city.id) : []), [city, localities]);
  const budgets = type === "rent" || category === "commercial" && type !== "sale" ? RENT_BUDGETS : SALE_BUDGETS;
  const types = PROPERTY_TYPES.filter((t) => !category || t.category === category);
  const sel = (k: string) => (params.get(k) ?? "").split(",").filter(Boolean);

  return (
    <div>
      <Group title="I want to">
        <div className="flex flex-wrap gap-2">
          {[[undefined, "All"], ["sale", "Buy"], ["rent", "Rent"]].map(([v, l]) => <Chip key={l} active={(type ?? undefined) === v} onClick={() => set({ type: v })}>{l}</Chip>)}
        </div>
      </Group>
      <Group title="Category">
        <div className="flex flex-wrap gap-2">
          {[[undefined, "All"], ["residential", "Residential"], ["commercial", "Commercial"], ["plot", "Plots & land"]].map(([v, l]) => <Chip key={l} active={(category ?? undefined) === v} onClick={() => set({ category: v, pt: undefined })}>{l}</Chip>)}
        </div>
      </Group>
      <Group title="City">
        <select className="input" value={params.get("city") ?? ""} onChange={(e) => set({ city: e.target.value || undefined, locality: undefined })}>
          <option value="">All cities</option>{cities.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        {cityLocs.length > 0 && (
          <div className="mt-3 flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
            {cityLocs.map((l) => <Chip key={l.id} active={sel("locality").includes(l.slug)} onClick={() => set({ locality: toggleIn(params.get("locality"), l.slug) })}>{l.name}</Chip>)}
          </div>
        )}
      </Group>
      <Group title="Property type">
        <div className="flex flex-wrap gap-2">{types.map((t) => <Chip key={t.value} active={sel("pt").includes(t.value)} onClick={() => set({ pt: toggleIn(params.get("pt"), t.value) })}>{t.label}</Chip>)}</div>
      </Group>
      {category !== "plot" && category !== "commercial" && (
        <Group title="Bedrooms">
          <div className="flex flex-wrap gap-2">{["1", "2", "3", "4"].map((b) => <Chip key={b} active={sel("beds").includes(b)} onClick={() => set({ beds: toggleIn(params.get("beds"), b) })}>{b === "4" ? "4+ BHK" : `${b} BHK`}</Chip>)}</div>
        </Group>
      )}
      <Group title={type === "rent" ? "Monthly rent" : "Budget"}>
        <div className="flex flex-wrap gap-2">
          {budgets.map(([l, min, max]) => <Chip key={l} active={(params.get("min") ?? "") === min && (params.get("max") ?? "") === max} onClick={() => set({ min: min || undefined, max: max || undefined })}>{l}</Chip>)}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input className="input !py-2.5 !text-sm" inputMode="numeric" placeholder="Min ₹" value={params.get("min") ?? ""} onChange={(e) => set({ min: e.target.value.replace(/\D/g, "") || undefined })} />
          <input className="input !py-2.5 !text-sm" inputMode="numeric" placeholder="Max ₹" value={params.get("max") ?? ""} onChange={(e) => set({ max: e.target.value.replace(/\D/g, "") || undefined })} />
        </div>
      </Group>
      <Group title="Area (sq ft)">
        <div className="grid grid-cols-2 gap-2">
          <input className="input !py-2.5 !text-sm" inputMode="numeric" placeholder="Min" value={params.get("amin") ?? ""} onChange={(e) => set({ amin: e.target.value.replace(/\D/g, "") || undefined })} />
          <input className="input !py-2.5 !text-sm" inputMode="numeric" placeholder="Max" value={params.get("amax") ?? ""} onChange={(e) => set({ amax: e.target.value.replace(/\D/g, "") || undefined })} />
        </div>
      </Group>
      <Group title="Furnishing">
        <div className="flex flex-wrap gap-2">{FURNISHING.map((f) => <Chip key={f.value} active={sel("furnishing").includes(f.value)} onClick={() => set({ furnishing: toggleIn(params.get("furnishing"), f.value) })}>{f.label}</Chip>)}</div>
      </Group>
      <Group title="Possession">
        <div className="flex flex-wrap gap-2">{[[undefined, "Any"], ["ready", "Ready to move"], ["under_construction", "Under construction"]].map(([v, l]) => <Chip key={l} active={(params.get("poss") ?? undefined) === v} onClick={() => set({ poss: v })}>{l}</Chip>)}</div>
      </Group>
      <Group title="More">
        <div className="space-y-2.5">
          {[["verified", "Verified listings only"], ["owner", "Posted by owners"]].map(([k, l]) => (
            <label key={k} className="flex cursor-pointer items-center justify-between rounded-2xl border-[1.5px] border-line px-4 py-3 text-sm font-semibold">
              {l}
              <span className={cx("relative h-6 w-11 rounded-full transition", params.get(k) === "1" ? "bg-brand-600" : "bg-black/15")}>
                <span className={cx("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", params.get(k) === "1" ? "left-[22px]" : "left-0.5")} />
              </span>
              <input type="checkbox" className="sr-only" checked={params.get(k) === "1"} onChange={(e) => set({ [k]: e.target.checked ? "1" : undefined })} />
            </label>
          ))}
        </div>
      </Group>
    </div>
  );
}

export const FILTER_KEYS = ["type", "category", "city", "locality", "pt", "beds", "min", "max", "amin", "amax", "furnishing", "poss", "verified", "owner", "q"];
export const activeFilterCount = (p: Params) => FILTER_KEYS.filter((k) => p.get(k)).length;
