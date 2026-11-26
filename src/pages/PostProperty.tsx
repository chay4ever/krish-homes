import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { CheckCircle2, ShieldCheck, Sparkles, X } from "lucide-react";
import { PropertyForm, fromProperty, toPayload, type FormState } from "@/components/PropertyForm";
import { Button, Empty, Spinner } from "@/components/ui";
import { useApp } from "@/lib/app";
import { api } from "@/lib/api";
import { useTitle } from "@/lib/hooks";

export default function PostProperty() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, authLoading, openAuth, brand } = useApp();
  const [initial, setInitial] = useState<FormState | undefined>();
  const [loading, setLoading] = useState(!!id);
  const [done, setDone] = useState<{ slug: string } | null>(null);
  useTitle(id ? "Edit listing" : "Post your property", brand.name);

  useEffect(() => {
    if (!id || !user) return;
    api.get<any>(`/api/u/properties/${id}`).then((p) => setInitial(fromProperty(p))).catch(() => nav("/account?tab=listings")).finally(() => setLoading(false));
  }, [id, user, nav]);

  if (authLoading) return <div className="grid place-items-center py-32"><Spinner className="size-8" /></div>;
  if (!user) return (
    <Empty icon={<Sparkles size={30} />} title="Post your property for free" text="Sign in with your phone or email to list your home — it takes under 3 minutes." action={<Button size="lg" onClick={() => openAuth("Sign in to post your property")}>Sign in to continue</Button>} />
  );
  if (loading) return <div className="grid place-items-center py-32"><Spinner className="size-8" /></div>;

  if (done) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-md px-4 py-16 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }} className="mx-auto grid size-24 place-items-center rounded-full bg-brand-100"><CheckCircle2 size={56} className="text-brand-700" /></motion.div>
      <h1 className="mt-6 text-2xl font-extrabold">{id ? "Changes saved" : "Your listing is submitted!"}</h1>
      <p className="mt-2 text-ink-3">Our team will review it shortly. You'll find it under <b>My listings</b> and can track enquiries there.</p>
      <div className="mt-8 flex flex-col gap-3"><Button size="lg" onClick={() => nav("/account?tab=listings")}>Go to my listings</Button><Button size="lg" variant="outline" onClick={() => { setDone(null); setInitial(undefined); nav("/post-property"); }}>Post another property</Button></div>
    </motion.div>
  );

  return (
    <div className="px-4 pb-6 pt-[calc(1rem+var(--safe-t))] sm:px-6 sm:py-10">
      <div className="mx-auto mb-6 flex max-w-2xl items-center justify-between">
        <div><h1 className="font-display text-2xl font-semibold sm:text-4xl">{id ? "Edit your listing" : "Post your property"}</h1><p className="mt-1 flex items-center gap-1.5 text-sm text-ink-3"><ShieldCheck size={15} className="text-brand-600" />Free · No brokerage · Reviewed by our team</p></div>
        <button onClick={() => nav(-1)} className="grid size-10 place-items-center rounded-full bg-black/5 active:scale-90" aria-label="Close"><X size={20} /></button>
      </div>
      <PropertyForm initial={initial} submitLabel={id ? "Save changes" : "Submit for review"} onSubmit={async (f) => {
        const r = id ? await api.put<any>(`/api/u/properties/${id}`, toPayload(f)) : await api.post<any>("/api/u/properties", toPayload(f));
        setDone({ slug: r.slug ?? "" });
      }} />
    </div>
  );
}
