import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { BellPlus, Home, LayoutGrid, Rows3, Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { CardSkeleton, PropertyCard } from "@/components/Cards";
import { Button, Chip, Empty, Sheet } from "@/components/ui";
import { FilterPanel, FILTER_KEYS, activeFilterCount } from "@/components/Filters";
import { useApp } from "@/lib/app";
import { api } from "@/lib/api";
import { useDebounced, useTitle } from "@/lib/hooks";
import { cx } from "@/lib/format";
import { typeLabel } from "../../shared/constants";
import type { Page, Property } from "@/lib/types";

const SORTS = [["new", "Newest first"], ["price_asc", "Price: Low to High"], ["price_desc", "Price: High to Low"], ["popular", "Most viewed"], ["featured", "Featured first"]];

export default function Search() {
  const { cities, requireAuth, toast, brand } = useApp();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [kw, setKw] = useState(params.get("q") ?? "");
  const dkw = useDebounced(kw, 450);

  const set = useCallback((patch: Record<string, string | undefined | null>) => {
    setParams((prev) => { const n = new URLSearchParams(prev); for (const [k, v] of Object.entries(patch)) v ? n.set(k, v) : n.delete(k); n.delete("page"); return n; }, { replace: true });
  }, [setParams]);

  useEffect(() => { if ((params.get("q") ?? "") !== dkw) set({ q: dkw || undefined }); /* eslint-disable-next-line */ }, [dkw]);

  const query = useMemo(() => params.toString(), [params]);
  useEffect(() => {
    let live = true;
    setLoading(true); setPage(1);
    api.get<Page<Property>>(`/api/properties?${query}&limit=12`).then((r) => { if (live) { setItems(r.items); setTotal(r.total); setLoading(false); } }).catch(() => live && setLoading(false));
    return () => { live = false; };
  }, [query]);

  const loadMore = async () => {
    setMore(true);
    try { const r = await api.get<Page<Property>>(`/api/properties?${query}&limit=12&page=${page + 1}`); setItems((i) => [...i, ...r.items]); setPage(page + 1); } finally { setMore(false); }
  };

  const city = cities.find((c) => c.slug === params.get("city"));
  const heading = `${params.get("type") === "rent" ? "Properties for rent" : params.get("type") === "sale" ? "Properties for sale" : "Properties"}${city ? ` in ${city.name}` : ""}`;
  useTitle(heading, brand.name);
  const n = activeFilterCount(params);

  const chips = FILTER_KEYS.filter((k) => params.get(k) && k !== "q").flatMap((k) =>
    params.get(k)!.split(",").map((v) => ({ k, v, label: k === "city" ? cities.find((c) => c.slug === v)?.name ?? v : k === "pt" ? typeLabel(v) : k === "beds" ? `${v} BHK` : k === "type" ? (v === "sale" ? "Buy" : "Rent") : k === "min" ? `Min ₹${Number(v).toLocaleString("en-IN")}` : k === "max" ? `Max ₹${Number(v).toLocaleString("en-IN")}` : k === "verified" ? "Verified" : k === "owner" ? "Owner" : k === "poss" ? v.replace("_", " ") : v })));

  const saveSearch = () => requireAuth("Sign in to save this search", async () => {
    try { await api.post("/api/u/saved-searches", { name: heading, query }); toast("Search saved to your account"); } catch (e: any) { toast(e.message, "error"); }
  });

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-6 lg:pt-8">
      {/* sticky bar */}
      <div className="sticky top-[calc(56px+var(--safe-t))] z-30 -mx-4 border-b border-line/60 px-4 py-3 glass sm:-mx-6 sm:px-6 lg:top-[72px]">
        <div className="mx-auto flex max-w-7xl items-center gap-2.5">
          <div className="relative min-w-0 flex-1">
            <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
            <input className="input !rounded-full !py-2.5 !pl-10" placeholder="Search locality, project, landmark…" value={kw} onChange={(e) => setKw(e.target.value)} aria-label="Search listings" />
          </div>
          <button onClick={() => setSheet(true)} className="relative flex h-11 shrink-0 items-center gap-2 rounded-full border-[1.5px] border-line bg-white px-4 text-sm font-bold active:scale-95 lg:hidden">
            <SlidersHorizontal size={17} />Filters{n > 0 && <span className="grid size-5 place-items-center rounded-full bg-brand-700 text-[11px] text-white">{n}</span>}
          </button>
          <select className="input hidden !w-[200px] !rounded-full !py-2.5 !text-sm lg:block" value={params.get("sort") ?? "new"} onChange={(e) => set({ sort: e.target.value === "new" ? undefined : e.target.value })} aria-label="Sort">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="no-scrollbar mx-auto mt-2.5 flex max-w-7xl gap-2 overflow-x-auto lg:hidden">
          {[[undefined, "All"], ["sale", "Buy"], ["rent", "Rent"]].map(([v, l]) => <Chip key={l} active={(params.get("type") ?? undefined) === v} onClick={() => set({ type: v })}>{l}</Chip>)}
          <span className="mx-1 w-px shrink-0 bg-line" />
          {[["1", "1 BHK"], ["2", "2 BHK"], ["3", "3 BHK"], ["4", "4+ BHK"]].map(([v, l]) => <Chip key={v} active={params.get("beds") === v} onClick={() => set({ beds: params.get("beds") === v ? undefined : v })}>{l}</Chip>)}
          <span className="mx-1 w-px shrink-0 bg-line" />
          <Chip active={params.get("verified") === "1"} onClick={() => set({ verified: params.get("verified") === "1" ? undefined : "1" })}>Verified</Chip>
        </div>
      </div>

      <div className="mt-5 grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-[160px] max-h-[calc(100dvh-180px)] overflow-y-auto rounded-[28px] border border-line bg-white p-5 shadow-card no-scrollbar">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-extrabold">Filters</h3>{n > 0 && <button className="text-sm font-bold text-brand-700" onClick={() => setParams({}, { replace: true })}>Clear all</button>}</div>
            <FilterPanel params={params} set={set} />
          </div>
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold sm:text-2xl">{heading}</h1>
              <p className="text-sm text-ink-3">{loading ? "Searching…" : `${total.toLocaleString("en-IN")} ${total === 1 ? "property" : "properties"} found`}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={saveSearch} className="flex h-10 items-center gap-2 rounded-full border-[1.5px] border-line bg-white px-4 text-sm font-bold text-brand-800 active:scale-95"><BellPlus size={16} /><span className="hidden sm:inline">Save search</span></button>
              <div className="hidden rounded-full bg-black/5 p-1 sm:flex">
                {([["grid", LayoutGrid], ["list", Rows3]] as const).map(([v, I]) => <button key={v} aria-label={`${v} view`} onClick={() => setView(v)} className={cx("grid size-8 place-items-center rounded-full transition", view === v ? "bg-white shadow-card" : "text-ink-3")}><I size={16} /></button>)}
              </div>
              <select className="input !w-auto !rounded-full !py-2 !text-sm lg:hidden" value={params.get("sort") ?? "new"} onChange={(e) => set({ sort: e.target.value === "new" ? undefined : e.target.value })} aria-label="Sort">
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {chips.map((c) => (
                <button key={c.k + c.v} onClick={() => { const rest = params.get(c.k)!.split(",").filter((x) => x !== c.v).join(","); set({ [c.k]: rest || undefined }); }} className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-bold capitalize text-brand-800 active:scale-95">{c.label}<X size={13} /></button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}</div>
          ) : items.length === 0 ? (
            <Empty icon={<Home size={30} />} title="No properties match yet" text="Try removing a filter or widening your budget — or set up a search alert and we'll tell you when something fits." action={<Button onClick={() => setParams({}, { replace: true })}>Clear all filters</Button>} />
          ) : (
            <>
              <motion.div layout className={cx("grid gap-5", view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
                <AnimatePresence initial={false}>
                  {items.map((p, i) => (
                    <motion.div key={p.id} layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
                      <PropertyCard p={p} layout={view} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
              {items.length < total && <div className="mt-8 flex justify-center"><Button variant="outline" size="lg" loading={more} onClick={loadMore}>Show more properties ({total - items.length} left)</Button></div>}
            </>
          )}
        </section>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Filters" wide
        footer={<div className="flex gap-3"><Button variant="outline" size="lg" className="flex-1" onClick={() => setParams({}, { replace: true })}>Clear</Button><Button size="lg" className="flex-[2]" onClick={() => setSheet(false)}>Show {loading ? "" : total} properties</Button></div>}>
        <FilterPanel params={params} set={set} />
      </Sheet>
    </div>
  );
}
