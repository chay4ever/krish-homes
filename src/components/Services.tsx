import { useState } from "react";
import { BarChart3, FileText, Landmark, PaintBucket, Scale, Truck, type LucideIcon } from "lucide-react";
import { Sheet, Button, Field, Input } from "./ui";
import { api } from "@/lib/api";
import { useApp } from "@/lib/app";
import { SERVICES } from "../../shared/constants";

const ICONS: Record<string, LucideIcon> = { landmark: Landmark, file: FileText, truck: Truck, paint: PaintBucket, scale: Scale, chart: BarChart3 };
const TONES = ["bg-sky-50 text-sky-700", "bg-amber-50 text-amber-700", "bg-rose-50 text-rose-600", "bg-violet-50 text-violet-700", "bg-emerald-50 text-emerald-700", "bg-teal-50 text-teal-700"];

export function Services() {
  const { user, city, toast } = useApp();
  const [svc, setSvc] = useState<(typeof SERVICES)[number] | null>(null);
  const [f, setF] = useState({ name: "", phone: "" }); const [busy, setBusy] = useState(false);
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
        {SERVICES.map((s, i) => { const I = ICONS[s.icon]; return (
          <button key={s.key} onClick={() => { setSvc(s); setF({ name: user?.name ?? "", phone: user?.phone ?? "" }); }} className="group flex flex-col items-start gap-3 rounded-3xl border border-line bg-white p-4 text-left shadow-card transition active:scale-95 sm:hover:-translate-y-1 sm:hover:shadow-lift">
            <span className={`grid size-12 place-items-center rounded-2xl transition group-hover:scale-110 ${TONES[i]}`}><I size={23} /></span>
            <span><span className="block font-extrabold">{s.label}</span><span className="mt-0.5 block text-xs leading-snug text-ink-3">{s.desc}</span></span>
          </button>); })}
      </div>
      <Sheet open={!!svc} onClose={() => setSvc(null)} title={svc?.label}>
        <form className="space-y-4 pt-2" onSubmit={async (e) => { e.preventDefault(); setBusy(true); try { await api.post("/api/leads", { kind: "general", name: f.name, phone: f.phone, message: `Service request: ${svc!.label}${city ? ` (${city.name})` : ""}`, source: `service:${svc!.key}` }); toast("Request received — we'll call you shortly"); setSvc(null); } catch (x: any) { toast(x.message, "error"); } finally { setBusy(false); } }}>
          <p className="text-sm text-ink-3">{svc?.desc}. Share your number and an advisor will call you back.</p>
          <Field label="Your name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
          <Field label="Mobile number"><Input type="tel" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} required placeholder="+91 98765 43210" /></Field>
          <Button type="submit" size="lg" full loading={busy}>Request a callback</Button>
        </form>
      </Sheet>
    </>
  );
}
