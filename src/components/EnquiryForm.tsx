import { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle2, MessageSquare, PhoneCall } from "lucide-react";
import { Button, Field, Input, Sheet } from "./ui";
import { useApp } from "@/lib/app";
import { api } from "@/lib/api";
import { cx } from "@/lib/format";

type Kind = "enquiry" | "visit" | "callback";
const KINDS: { k: Kind; label: string; icon: typeof PhoneCall; cta: string }[] = [
  { k: "enquiry", label: "Enquire", icon: MessageSquare, cta: "Send enquiry" },
  { k: "visit", label: "Book visit", icon: CalendarCheck, cta: "Schedule visit" },
  { k: "callback", label: "Call me", icon: PhoneCall, cta: "Request callback" },
];

export function EnquiryForm({ propertySlug, projectSlug, title, initialKind = "enquiry", onDone }: { propertySlug?: string; projectSlug?: string; title?: string; initialKind?: Kind; onDone?: () => void }) {
  const { user, toast } = useApp();
  const [kind, setKind] = useState<Kind>(initialKind);
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [email, setEmail] = useState("");
  const [message, setMessage] = useState(""); const [visitAt, setVisitAt] = useState("");
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false); const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (user) { setName((n) => n || user.name || ""); setPhone((p) => p || user.phone || ""); setEmail((e) => e || user.email || ""); } }, [user]);
  useEffect(() => setKind(initialKind), [initialKind]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      await api.post("/api/leads", { kind, name, phone, email, message, visitAt: kind === "visit" ? visitAt : undefined, propertySlug, projectSlug, source: "web" });
      setDone(true); toast("Thanks! We'll be in touch shortly."); onDone?.();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  if (done) return (
    <div className="py-8 text-center">
      <CheckCircle2 size={56} className="mx-auto text-brand-600" />
      <h3 className="mt-4 text-xl font-extrabold">Request received</h3>
      <p className="mx-auto mt-1 max-w-xs text-sm text-ink-3">An advisor will call you on {phone} soon. You can track this from your account.</p>
      <Button variant="soft" className="mt-5" onClick={() => setDone(false)}>Send another</Button>
    </div>
  );
  const K = KINDS.find((x) => x.k === kind)!;
  return (
    <form onSubmit={submit} className="space-y-3.5">
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/5 p-1">
        {KINDS.map((x) => <button type="button" key={x.k} onClick={() => setKind(x.k)} className={cx("flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-bold transition", kind === x.k ? "bg-white text-brand-800 shadow-card" : "text-ink-3")}><x.icon size={17} />{x.label}</button>)}
      </div>
      {title && <p className="text-sm text-ink-3">Regarding <b className="text-ink">{title}</b></p>}
      <Field label="Your name"><Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required placeholder="Full name" /></Field>
      <Field label="Mobile number"><Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" required placeholder="+91 98765 43210" /></Field>
      {kind === "visit" && <Field label="Preferred date & time"><Input type="datetime-local" value={visitAt} onChange={(e) => setVisitAt(e.target.value)} required /></Field>}
      <Field label="Email (optional)"><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" /></Field>
      {kind === "enquiry" && <Field label="Message"><textarea className="input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="I'm interested in this property…" maxLength={800} /></Field>}
      {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
      <Button type="submit" size="lg" full loading={busy}>{K.cta}</Button>
      <p className="text-center text-[11px] text-ink-3">By continuing you agree to be contacted about this property.</p>
    </form>
  );
}

export function EnquirySheet({ open, onClose, ...p }: { open: boolean; onClose: () => void; propertySlug?: string; projectSlug?: string; title?: string; initialKind?: Kind }) {
  return <Sheet open={open} onClose={onClose} title="Get in touch"><EnquiryForm {...p} /></Sheet>;
}
