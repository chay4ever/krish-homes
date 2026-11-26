import { useMemo, useState } from "react";
import { Check, Crosshair, MapPin, Search } from "lucide-react";
import { Sheet } from "./ui";
import { Img } from "./Img";
import { useApp } from "@/lib/app";
import { cx } from "@/lib/format";
import { CITY_COORDS } from "../../shared/constants";

const km = (a: [number, number], b: [number, number]) => {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

export default function LocationPicker() {
  const { cities, city, selectCity, pickerOpen, closePicker, toast } = useApp();
  const [q, setQ] = useState(""); const [locating, setLocating] = useState(false);
  const filtered = useMemo(() => cities.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase())), [cities, q]);
  const popular = useMemo(() => [...cities].sort((a, b) => (b.listings ?? 0) - (a.listings ?? 0)).slice(0, 6), [cities]);
  const groups = useMemo(() => {
    const m = new Map<string, typeof cities>();
    for (const c of filtered) m.set(c.state ?? "Other", [...(m.get(c.state ?? "Other") ?? []), c]);
    return [...m.entries()].sort(([a]) => (a === "Andhra Pradesh" ? -1 : 1));
  }, [filtered]);

  const detect = () => {
    if (!navigator.geolocation) { toast("Location isn't available on this device", "error"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const here: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        const best = cities.map((c) => ({ c, d: CITY_COORDS[c.slug] ? km(here, CITY_COORDS[c.slug]) : Infinity })).sort((a, b) => a.d - b.d)[0];
        if (best && best.d < 120) { selectCity(best.c.slug); toast(`Showing homes in ${best.c.name}`); }
        else toast("We're not in your area yet — please pick the nearest city", "info");
      },
      () => { setLocating(false); toast("Couldn't get your location. Please pick a city.", "error"); },
      { timeout: 8000, maximumAge: 600000 },
    );
  };

  return (
    <Sheet open={pickerOpen} onClose={closePicker} title="Choose your city" wide>
      <div className="space-y-5 pt-1">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input className="input !rounded-full !pl-10" placeholder="Search city…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search city" />
        </div>
        <button onClick={detect} disabled={locating} className="flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-brand-200 bg-brand-50 p-3.5 text-left transition active:scale-[0.98]">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-700 text-white"><Crosshair size={19} className={cx(locating && "animate-spin")} /></span>
          <span><span className="block font-extrabold text-brand-900">{locating ? "Finding you…" : "Use my current location"}</span><span className="block text-xs text-ink-3">We'll pick the nearest city we serve</span></span>
        </button>
        {!q && (
          <div>
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-ink-3">Popular cities</h3>
            <div className="grid grid-cols-3 gap-2.5">
              {popular.map((c) => (
                <button key={c.id} onClick={() => selectCity(c.slug)} className={cx("group relative aspect-[4/3] overflow-hidden rounded-2xl text-left ring-2 transition active:scale-95", city?.slug === c.slug ? "ring-brand-600" : "ring-transparent")}>
                  <Img src={c.image} alt="" seed={c.slug} className="size-full transition duration-500 group-hover:scale-110" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  <span className="absolute inset-x-2 bottom-2 text-xs font-extrabold leading-tight text-white sm:text-sm">{c.name}{city?.slug === c.slug && <Check size={13} className="ml-1 inline" />}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {groups.map(([state, list]) => (
          <div key={state}>
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-ink-3">{state}</h3>
            <div className="flex flex-wrap gap-2">
              {list.map((c) => (
                <button key={c.id} onClick={() => selectCity(c.slug)} className={cx("flex items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-2 text-sm font-semibold transition active:scale-95", city?.slug === c.slug ? "border-brand-700 bg-brand-700 text-white" : "border-line bg-white hover:border-brand-400")}>
                  <MapPin size={14} />{c.name}{!!c.listings && <span className={cx("text-xs", city?.slug === c.slug ? "text-white/70" : "text-ink-3")}>{c.listings}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
        {!filtered.length && <p className="py-6 text-center text-sm text-ink-3">No city matches "{q}". We're adding more soon.</p>}
        {city && <button onClick={() => selectCity(null)} className="mx-auto block text-sm font-bold text-brand-700">Show all cities</button>}
      </div>
    </Sheet>
  );
}
