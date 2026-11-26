import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, ImagePlus, Key, Loader2, Star, Trash2, Home as HomeIcon, Info } from "lucide-react";
import { Button, Chip, Field, Input } from "./ui";
import { useApp } from "@/lib/app";
import { uploadImage } from "@/lib/api";
import { cx, inr } from "@/lib/format";
import { AMENITIES, FACINGS, FURNISHING, PROPERTY_TYPES, typeLabel } from "../../shared/constants";

export interface FormState {
  listing_type: "sale" | "rent" | ""; property_type: string; owner_type: string;
  city_id: string; locality_id: string; address: string;
  bedrooms: string; bathrooms: string; balconies: string; area_sqft: string; plot_area: string; floor: string; total_floors: string; age_years: string;
  facing: string; furnishing: string; possession: string; price: string; maintenance: string; deposit: string; negotiable: boolean; available_from: string; parking: string; preferred_tenants: string;
  images: string[]; amenities: string[]; video_url: string; title: string; description: string; contact_name: string; contact_phone: string; rera_id: string;
  featured: boolean; verified: boolean; staff_id: string;
}
export const emptyForm: FormState = {
  listing_type: "", property_type: "", owner_type: "owner", city_id: "", locality_id: "", address: "", bedrooms: "", bathrooms: "", balconies: "", area_sqft: "", plot_area: "", floor: "", total_floors: "", age_years: "",
  facing: "", furnishing: "", possession: "ready", price: "", maintenance: "", deposit: "", negotiable: false, available_from: "", parking: "", preferred_tenants: "", images: [], amenities: [], video_url: "", title: "", description: "",
  contact_name: "", contact_phone: "", rera_id: "", featured: false, verified: false, staff_id: "",
};
export const fromProperty = (p: any): FormState => {
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  return { ...emptyForm, listing_type: p.listing_type, property_type: p.property_type, owner_type: p.owner_type ?? "owner", city_id: s(p.city_id), locality_id: s(p.locality_id), address: s(p.address),
    bedrooms: s(p.bedrooms), bathrooms: s(p.bathrooms), balconies: s(p.balconies), area_sqft: s(p.area_sqft), plot_area: s(p.plot_area), floor: s(p.floor), total_floors: s(p.total_floors), age_years: s(p.age_years),
    facing: s(p.facing), furnishing: s(p.furnishing), possession: p.possession ?? "ready", price: s(p.price), maintenance: s(p.maintenance), deposit: s(p.deposit), negotiable: !!p.negotiable, available_from: s(p.available_from), parking: s(p.parking),
    preferred_tenants: s(p.preferred_tenants), images: p.images ?? [], amenities: p.amenities ?? [], video_url: s(p.video_url), title: s(p.title), description: s(p.description), contact_name: s(p.contact_name), contact_phone: s(p.contact_phone),
    rera_id: s(p.rera_id), featured: !!p.featured, verified: !!p.verified, staff_id: s(p.staff_id) };
};

const STEPS = ["Basics", "Location", "Details", "Photos", "Review"];

const Stepper = ({ value, onChange, min = 0, max = 10 }: { value: string; onChange: (v: string) => void; min?: number; max?: number }) => {
  const n = value === "" ? null : Number(value);
  return (
    <div className="flex items-center justify-between rounded-2xl border-[1.5px] border-line bg-white p-1.5">
      <button type="button" onClick={() => onChange(String(Math.max(min, (n ?? min) - 1)))} className="grid size-10 place-items-center rounded-xl bg-surface text-xl font-bold active:scale-90" aria-label="Decrease">−</button>
      <span className="text-lg font-extrabold tabular">{n ?? "—"}</span>
      <button type="button" onClick={() => onChange(String(Math.min(max, (n ?? min - 1) + 1)))} className="grid size-10 place-items-center rounded-xl bg-surface text-xl font-bold active:scale-90" aria-label="Increase">+</button>
    </div>
  );
};

export function PropertyForm({ initial, onSubmit, admin, agents, submitLabel = "Submit for review", lockedHeader }: { initial?: FormState; onSubmit: (f: FormState) => Promise<void>; admin?: boolean; agents?: { id: number; name: string }[]; submitLabel?: string; lockedHeader?: React.ReactNode }) {
  const { cities, localities, user, toast } = useApp();
  const [f, setF] = useState<FormState>(() => ({ ...(initial ?? emptyForm), contact_name: initial?.contact_name || user?.name || "", contact_phone: initial?.contact_phone || user?.phone || "" }));
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  const pt = PROPERTY_TYPES.find((t) => t.value === f.property_type);
  const hasBeds = !!pt?.beds; const isPlot = pt?.category === "plot"; const isCommercial = pt?.category === "commercial";
  const locs = useMemo(() => localities.filter((l) => String(l.city_id) === f.city_id), [localities, f.city_id]);
  const city = cities.find((c) => String(c.id) === f.city_id);
  const locName = locs.find((l) => String(l.id) === f.locality_id)?.name;
  const suggestTitle = () => `${hasBeds && f.bedrooms ? f.bedrooms + " BHK " : ""}${typeLabel(f.property_type).split(" / ")[0]} for ${f.listing_type === "rent" ? "rent" : "sale"}${locName ? " in " + locName : city ? " in " + city.name : ""}`;

  const validate = (s: number): string | null => {
    if (s === 0) { if (!f.listing_type) return "Choose whether you want to sell or rent"; if (!f.property_type) return "Choose a property type"; }
    if (s === 1) { if (!f.city_id) return "Select a city"; if (!f.locality_id) return "Select a locality"; }
    if (s === 2) { if (!f.area_sqft || Number(f.area_sqft) <= 0) return "Enter the area in sq ft"; if (!f.price || Number(f.price) <= 0) return "Enter the price"; if (hasBeds && !f.bedrooms) return "Select the number of bedrooms"; }
    if (s === 3) { if (!f.images.length) return "Add at least one photo — listings with photos get 5× more enquiries"; }
    if (s === 4) { if (f.title.trim().length < 8) return "Add a title of at least 8 characters"; if (!/^[+()\-\s\d]{8,18}$/.test(f.contact_phone.trim())) return "Enter a valid contact phone number"; }
    return null;
  };
  const go = (n: number) => { if (n > step) { const e = validate(step); if (e) { setErr(e); return; } } setErr(null); setDir(n > step ? 1 : -1); setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); if (n === 4 && !f.title) set("title", suggestTitle()); };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, 30 - f.images.length);
    setUploading((u) => u + list.length);
    for (const file of list) {
      try { const url = await uploadImage(file); setF((s) => ({ ...s, images: [...s.images, url] })); } catch (e: any) { toast(e.message, "error"); } finally { setUploading((u) => u - 1); }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    const e = validate(4); if (e) { setErr(e); return; }
    setBusy(true); setErr(null);
    try { await onSubmit(f); } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  };

  const Card = ({ active, onClick, icon, label, sub }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; sub?: string }) => (
    <button type="button" onClick={onClick} className={cx("relative flex flex-col items-start gap-2 rounded-3xl border-2 p-4 text-left transition active:scale-[0.97]", active ? "border-brand-600 bg-brand-50" : "border-line bg-white hover:border-brand-300")}>
      <span className={cx("grid size-11 place-items-center rounded-2xl", active ? "bg-brand-700 text-white" : "bg-surface text-ink-2")}>{icon}</span>
      <span className="font-extrabold">{label}</span>{sub && <span className="text-xs text-ink-3">{sub}</span>}
      {active && <Check size={18} className="absolute right-3 top-3 rounded-full bg-brand-700 p-0.5 text-white" />}
    </button>
  );

  const body = [
    // 0 BASICS
    <div key="0" className="space-y-7">
      <div><h2 className="text-xl font-extrabold">What are you listing?</h2><p className="text-sm text-ink-3">Pick the option that fits best.</p></div>
      <div className="grid grid-cols-2 gap-3">
        <Card active={f.listing_type === "sale"} onClick={() => set("listing_type", "sale")} icon={<HomeIcon size={22} />} label="Sell" sub="Find a buyer" />
        <Card active={f.listing_type === "rent"} onClick={() => set("listing_type", "rent")} icon={<Key size={22} />} label="Rent / Lease" sub="Find a tenant" />
      </div>
      <Field label="Property type"><div className="flex flex-wrap gap-2">{PROPERTY_TYPES.map((t) => <Chip key={t.value} active={f.property_type === t.value} onClick={() => set("property_type", t.value)}>{t.label}</Chip>)}</div></Field>
      <Field label="You are a"><div className="flex gap-2">{[["owner", "Owner"], ["agent", "Agent"], ["builder", "Builder"]].map(([v, l]) => <Chip key={v} active={f.owner_type === v} onClick={() => set("owner_type", v)}>{l}</Chip>)}</div></Field>
    </div>,
    // 1 LOCATION
    <div key="1" className="space-y-5">
      <div><h2 className="text-xl font-extrabold">Where is it located?</h2><p className="text-sm text-ink-3">Accurate location helps the right people find you.</p></div>
      <Field label="City"><select className="input" value={f.city_id} onChange={(e) => setF((s) => ({ ...s, city_id: e.target.value, locality_id: "" }))}><option value="">Select city</option>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label="Locality" hint={!f.city_id ? "Choose a city first" : undefined}><select className="input" disabled={!f.city_id} value={f.locality_id} onChange={(e) => set("locality_id", e.target.value)}><option value="">Select locality</option>{locs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
      <Field label="Street / apartment / landmark" hint="Shown to people who enquire"><Input value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="e.g. Plot 14, Road No. 3, near Metro station" maxLength={250} /></Field>
    </div>,
    // 2 DETAILS
    <div key="2" className="space-y-5">
      <div><h2 className="text-xl font-extrabold">Property details</h2><p className="text-sm text-ink-3">The more you share, the better it performs.</p></div>
      {hasBeds && <div className="grid grid-cols-3 gap-3"><Field label="Bedrooms"><Stepper value={f.bedrooms} min={1} max={10} onChange={(v) => set("bedrooms", v)} /></Field><Field label="Bathrooms"><Stepper value={f.bathrooms} min={1} max={10} onChange={(v) => set("bathrooms", v)} /></Field><Field label="Balconies"><Stepper value={f.balconies} onChange={(v) => set("balconies", v)} /></Field></div>}
      <div className="grid grid-cols-2 gap-3">
        <Field label={isPlot ? "Plot area (sq ft)" : "Built-up area (sq ft)"}><Input inputMode="numeric" value={f.area_sqft} onChange={(e) => set("area_sqft", e.target.value.replace(/\D/g, ""))} placeholder="1200" /></Field>
        {(pt?.value === "villa" || pt?.value === "independent_house") && <Field label="Plot area (sq ft)"><Input inputMode="numeric" value={f.plot_area} onChange={(e) => set("plot_area", e.target.value.replace(/\D/g, ""))} /></Field>}
      </div>
      <Field label={f.listing_type === "rent" ? "Monthly rent (₹)" : "Expected price (₹)"} hint={f.price ? `= ${inr(Number(f.price))}${f.listing_type === "rent" ? " per month" : ""}` : undefined}><Input inputMode="numeric" value={f.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} placeholder={f.listing_type === "rent" ? "25000" : "7500000"} className="!text-lg !font-bold" /></Field>
      <div className="grid grid-cols-2 gap-3">
        {f.listing_type === "rent" ? <Field label="Security deposit (₹)"><Input inputMode="numeric" value={f.deposit} onChange={(e) => set("deposit", e.target.value.replace(/\D/g, ""))} /></Field> : <Field label="Maintenance (₹/mo)"><Input inputMode="numeric" value={f.maintenance} onChange={(e) => set("maintenance", e.target.value.replace(/\D/g, ""))} /></Field>}
        <label className="flex items-end"><span className={cx("flex h-[52px] w-full cursor-pointer items-center justify-between rounded-2xl border-[1.5px] px-4 text-sm font-semibold", f.negotiable ? "border-brand-600 bg-brand-50" : "border-line bg-white")}>Negotiable<input type="checkbox" className="size-5 accent-[#0a5e50]" checked={f.negotiable} onChange={(e) => set("negotiable", e.target.checked)} /></span></label>
      </div>
      {!isPlot && <div className="grid grid-cols-3 gap-3"><Field label="Floor"><Input inputMode="numeric" value={f.floor} onChange={(e) => set("floor", e.target.value.replace(/\D/g, ""))} placeholder="3" /></Field><Field label="Total floors"><Input inputMode="numeric" value={f.total_floors} onChange={(e) => set("total_floors", e.target.value.replace(/\D/g, ""))} placeholder="12" /></Field><Field label="Age (yrs)"><Input inputMode="numeric" value={f.age_years} onChange={(e) => set("age_years", e.target.value.replace(/\D/g, ""))} placeholder="0" /></Field></div>}
      <Field label="Facing"><div className="flex flex-wrap gap-2">{FACINGS.map((d) => <Chip key={d} active={f.facing === d} onClick={() => set("facing", f.facing === d ? "" : d)}>{d}</Chip>)}</div></Field>
      {!isPlot && <Field label="Furnishing"><div className="flex flex-wrap gap-2">{FURNISHING.map((d) => <Chip key={d.value} active={f.furnishing === d.value} onClick={() => set("furnishing", d.value)}>{d.label}</Chip>)}</div></Field>}
      <Field label="Possession"><div className="flex gap-2">{[["ready", "Ready to move"], ["under_construction", "Under construction"]].map(([v, l]) => <Chip key={v} active={f.possession === v} onClick={() => set("possession", v)}>{l}</Chip>)}</div></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Covered parking"><Stepper value={f.parking} onChange={(v) => set("parking", v)} max={6} /></Field>{f.listing_type === "rent" && <Field label="Available from"><Input type="date" value={f.available_from} onChange={(e) => set("available_from", e.target.value)} /></Field>}</div>
      {isCommercial && <Field label="RERA / registration ID"><Input value={f.rera_id} onChange={(e) => set("rera_id", e.target.value)} /></Field>}
    </div>,
    // 3 PHOTOS
    <div key="3" className="space-y-6">
      <div><h2 className="text-xl font-extrabold">Photos & amenities</h2><p className="text-sm text-ink-3">The first photo is your cover. Bright, landscape shots work best.</p></div>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {f.images.map((src, i) => (
          <div key={src} className="group relative aspect-square overflow-hidden rounded-2xl bg-surface">
            <img src={src} alt="" className="size-full object-cover" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-bold text-white">COVER</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 p-1.5">
              {i > 0 ? <button type="button" onClick={() => set("images", [src, ...f.images.filter((x) => x !== src)])} className="grid size-7 place-items-center rounded-full bg-white/90" aria-label="Make cover"><Star size={14} /></button> : <span />}
              <button type="button" onClick={() => set("images", f.images.filter((x) => x !== src))} className="grid size-7 place-items-center rounded-full bg-white/90 text-danger" aria-label="Remove"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {Array.from({ length: uploading }, (_, i) => <div key={"u" + i} className="grid aspect-square place-items-center rounded-2xl bg-surface"><Loader2 className="animate-spin text-brand-600" /></div>)}
        {f.images.length + uploading < 30 && (
          <button type="button" onClick={() => fileRef.current?.click()} className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/60 text-brand-700 transition active:scale-95"><span className="flex flex-col items-center gap-1 text-xs font-bold"><ImagePlus size={26} />Add photos</span></button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
      <Field label="Amenities"><div className="flex flex-wrap gap-2">{AMENITIES.map((a) => <Chip key={a} active={f.amenities.includes(a)} onClick={() => set("amenities", f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a])}>{a}</Chip>)}</div></Field>
      <Field label="Video tour link (optional)"><Input type="url" value={f.video_url} onChange={(e) => set("video_url", e.target.value)} placeholder="https://youtube.com/…" /></Field>
    </div>,
    // 4 REVIEW
    <div key="4" className="space-y-5">
      <div><h2 className="text-xl font-extrabold">Final touches</h2><p className="text-sm text-ink-3">{admin ? "Review and publish." : "Our team reviews every listing before it goes live — usually within a few hours."}</p></div>
      <Field label="Listing title"><Input value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={140} /><button type="button" className="mt-1.5 text-xs font-bold text-brand-700" onClick={() => set("title", suggestTitle())}>Suggest a title</button></Field>
      <Field label="Description"><textarea className="input min-h-36" value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={5000} placeholder="Highlight what makes this property special — nearby schools, metro, society features, reason for selling…" /></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Contact name"><Input value={f.contact_name} onChange={(e) => set("contact_name", e.target.value)} /></Field><Field label="Contact phone"><Input type="tel" inputMode="tel" value={f.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} placeholder="+91…" /></Field></div>
      <p className="flex items-start gap-2 rounded-2xl bg-brand-50 p-3.5 text-xs font-medium text-brand-900"><Info size={16} className="mt-0.5 shrink-0" />Your phone number is only shown to signed-in people who ask for it.</p>
      {admin && (
        <div className="space-y-4 rounded-3xl border border-gold-300 bg-gold-100/40 p-4">
          <h3 className="text-sm font-extrabold">Admin options</h3>
          <Field label="Assigned agent"><select className="input" value={f.staff_id} onChange={(e) => set("staff_id", e.target.value)}><option value="">Me</option>{agents?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
          <div className="flex flex-wrap gap-2"><Chip active={f.featured} onClick={() => set("featured", !f.featured)}>⭐ Featured</Chip><Chip active={f.verified} onClick={() => set("verified", !f.verified)}>✔ Verified</Chip></div>
        </div>
      )}
    </div>,
  ];

  return (
    <div className="mx-auto max-w-2xl">
      {lockedHeader}
      <div className="mb-6 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <button key={s} type="button" onClick={() => i < step && go(i)} className="flex-1" aria-label={`Step ${i + 1}: ${s}`}>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/10"><motion.div className="h-full rounded-full bg-brand-600" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.35 }} /></div>
            <span className={cx("mt-1.5 hidden text-[11px] font-bold sm:block", i === step ? "text-brand-800" : "text-ink-3")}>{s}</span>
          </button>
        ))}
      </div>
      <p className="mb-4 text-xs font-bold uppercase tracking-wider text-brand-700 sm:hidden">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div key={step} custom={dir} initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }} transition={{ duration: 0.22 }}>{body[step]}</motion.div>
      </AnimatePresence>
      {err && <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{err}</motion.p>}
      <div className="sticky bottom-0 -mx-4 mt-8 flex gap-3 border-t border-line bg-white/95 px-4 pb-[calc(0.9rem+var(--safe-b))] pt-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        {step > 0 && <Button variant="outline" size="lg" onClick={() => go(step - 1)} type="button"><ArrowLeft size={18} />Back</Button>}
        {step < STEPS.length - 1 ? <Button size="lg" className="flex-1" onClick={() => go(step + 1)} type="button">Continue<ArrowRight size={18} /></Button> : <Button size="lg" className="flex-1" loading={busy} onClick={submit} type="button"><Check size={18} />{submitLabel}</Button>}
      </div>
    </div>
  );
}

export const toPayload = (f: FormState) => ({ ...f, staff_id: f.staff_id || undefined });
