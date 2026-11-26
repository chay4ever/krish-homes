import { useState } from "react";
import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, BadgeCheck, Building2, Calendar, Check, Clock, Heart, Mail, MapPin, Phone, ShieldCheck, Users, Compass, Layers } from "lucide-react";
import { CardSkeleton, ProjectCard, PropertyCard } from "@/components/Cards";
import { EmiCalculator } from "@/components/Emi";
import { EnquiryForm } from "@/components/EnquiryForm";
import { Gallery } from "@/components/Gallery";
import { Img } from "@/components/Img";
import { Reveal } from "@/components/Reveal";
import { Button, Empty, Field, Input, SectionHead, Skeleton } from "@/components/ui";
import { useApp } from "@/lib/app";
import { useFetch, useTitle } from "@/lib/hooks";
import { dateFmt, inr } from "@/lib/format";
import { api } from "@/lib/api";
import type { Post, Project, Property } from "@/lib/types";

const Wrap = ({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) => <div className={`mx-auto px-4 py-6 sm:px-6 sm:py-10 ${narrow ? "max-w-3xl" : "max-w-7xl"}`}>{children}</div>;

export function PageHero({ title, sub }: { title: string; sub?: string }) {
  return (
    <section className="bg-hero relative overflow-hidden"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16"><motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl font-semibold text-white sm:text-5xl">{title}</motion.h1>{sub && <p className="mt-3 max-w-2xl text-white/70 sm:text-lg">{sub}</p>}</div></section>
  );
}

export function Projects() {
  const { brand, cities } = useApp();
  useTitle("New projects", brand.name);
  const [city, setCity] = useState("");
  const { data, loading } = useFetch<{ items: Project[] }>(`/api/projects${city ? `?city=${city}` : ""}`);
  return (
    <>
      <PageHero title="New launches & projects" sub="Explore upcoming and ready developments from trusted builders." />
      <Wrap>
        <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar">
          {[{ slug: "", name: "All cities" }, ...cities].map((c) => <button key={c.slug} onClick={() => setCity(c.slug)} className={`shrink-0 rounded-full border-[1.5px] px-4 py-2 text-sm font-bold transition active:scale-95 ${city === c.slug ? "border-brand-700 bg-brand-700 text-white" : "border-line bg-white text-ink-2"}`}>{c.name}</button>)}
        </div>
        {loading ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</div>
          : !data?.items.length ? <Empty icon={<Building2 size={30} />} title="No projects here yet" text="Check back soon or explore other cities." />
          : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{data.items.map((p, i) => <Reveal key={p.id} delay={(i % 3) * 0.06}><ProjectCard p={p} /></Reveal>)}</div>}
      </Wrap>
    </>
  );
}

export function ProjectDetail() {
  const { slug } = useParams();
  const { brand } = useApp();
  const { data: p, loading, error } = useFetch<Project>(`/api/projects/${slug}`);
  useTitle(p?.name ?? "Project", brand.name);
  if (loading) return <Wrap><Skeleton className="h-[420px] w-full !rounded-3xl" /></Wrap>;
  if (error || !p) return <Empty icon={<Building2 size={30} />} title="Project not found" action={<Link to="/projects"><Button>All projects</Button></Link>} />;
  return (
    <div className="pb-10">
      <div className="mx-auto max-w-7xl px-0 sm:px-6 lg:pt-6"><Gallery images={p.images} alt={p.name} seed={p.slug} /></div>
      <div className="mx-auto mt-6 grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <header>
            <h1 className="font-display text-3xl font-semibold sm:text-5xl">{p.name}</h1>
            <p className="mt-1 text-ink-3">by <b className="text-ink-2">{p.builder}</b></p>
            <p className="mt-2 flex items-center gap-1.5 text-ink-3"><MapPin size={16} className="text-brand-600" />{[p.address, p.locality_name, p.city_name].filter(Boolean).join(", ")}</p>
          </header>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["Price", `${inr(p.price_min)} – ${inr(p.price_max)}`, Layers], ["Configuration", p.configurations, Building2], ["Possession", p.possession, Calendar], ["Total units", p.total_units, Users]].map(([k, v, I]: any) => v && <div key={k} className="rounded-3xl border border-line bg-white p-4 shadow-card"><I size={20} className="text-brand-600" /><div className="mt-2 text-xs font-semibold text-ink-3">{k}</div><div className="text-sm font-extrabold">{v}</div></div>)}
          </div>
          {p.description && <section><h2 className="mb-3 text-xl font-extrabold">Overview</h2><p className="prose-lite whitespace-pre-line">{p.description}</p>{p.rera_id && <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-brand-800"><ShieldCheck size={16} />RERA: {p.rera_id}</p>}</section>}
          {!!p.amenities?.length && <section><h2 className="mb-4 text-xl font-extrabold">Amenities</h2><ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">{p.amenities.map((a) => <li key={a} className="flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-3 text-sm font-semibold shadow-card"><Check size={16} className="text-brand-600" />{a}</li>)}</ul></section>}
          {!!p.properties?.length && <section><h2 className="mb-4 text-xl font-extrabold">Available units</h2><div className="grid gap-5 sm:grid-cols-2">{p.properties.map((x: Property) => <PropertyCard key={x.id} p={x} />)}</div></section>}
          {p.price_min && <section><h2 className="mb-4 text-xl font-extrabold">Plan your EMI</h2><div className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7"><EmiCalculator price={p.price_min} compact /></div></section>}
        </div>
        <aside><div className="sticky top-24 rounded-[28px] border border-line bg-white p-5 shadow-card"><h3 className="mb-1 text-lg font-extrabold">Interested in {p.name}?</h3><p className="mb-4 text-sm text-ink-3">Get brochure, price list and site-visit slots.</p><EnquiryForm projectSlug={p.slug} title={p.name} /></div></aside>
      </div>
    </div>
  );
}

export function Saved() {
  const { user, openAuth, brand, favIds } = useApp();
  useTitle("Shortlist", brand.name);
  const { data, loading } = useFetch<{ items: Property[] }>(user ? "/api/u/favorites" : null, [favIds.size]);
  if (!user) return <Empty icon={<Heart size={30} />} title="Your shortlist lives here" text="Sign in to save homes you love and compare them anytime, on any device." action={<Button size="lg" onClick={() => openAuth("Sign in to see your shortlist")}>Sign in</Button>} />;
  return (
    <Wrap>
      <SectionHead title="Your shortlist" sub={`${data?.items.length ?? 0} saved ${data?.items.length === 1 ? "property" : "properties"}`} />
      {loading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</div>
        : !data?.items.length ? <Empty icon={<Heart size={30} />} title="Nothing saved yet" text="Tap the heart on any listing to save it here." action={<Link to="/search"><Button>Browse properties</Button></Link>} />
        : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.items.map((p) => <PropertyCard key={p.id} p={p} />)}</div>}
    </Wrap>
  );
}

export function Blog() {
  const { brand } = useApp(); useTitle("Guides & insights", brand.name);
  const { data, loading } = useFetch<{ items: Post[] }>("/api/posts");
  return (
    <>
      <PageHero title="Guides & insights" sub="Practical advice for buyers, sellers, tenants and investors." />
      <Wrap><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? [0, 1, 2].map((i) => <CardSkeleton key={i} />) : data?.items.map((p) => (
          <Link key={p.slug} to={`/blog/${p.slug}`} className="group overflow-hidden rounded-[26px] border border-line bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lift">
            <div className="aspect-[16/9] overflow-hidden"><Img src={p.cover} alt={p.title} seed={p.slug} className="size-full transition duration-700 group-hover:scale-105" /></div>
            <div className="p-5"><div className="text-xs font-semibold text-ink-3">{dateFmt(p.created_at)} · {p.author}</div><h3 className="mt-1.5 text-lg font-bold leading-snug">{p.title}</h3><p className="mt-2 line-clamp-3 text-sm text-ink-3">{p.excerpt}</p></div>
          </Link>
        ))}
      </div></Wrap>
    </>
  );
}

export function BlogPost() {
  const { slug } = useParams(); const { brand } = useApp();
  const { data: p, loading, error } = useFetch<Post>(`/api/posts/${slug}`);
  useTitle(p?.title, brand.name);
  if (loading) return <Wrap narrow><Skeleton className="h-64 w-full" /></Wrap>;
  if (error || !p) return <Empty title="Article not found" action={<Link to="/blog"><Button>All guides</Button></Link>} />;
  return (
    <Wrap narrow>
      <article>
        <div className="aspect-[16/9] overflow-hidden rounded-[28px]"><Img src={p.cover} alt={p.title} seed={p.slug} className="size-full" eager /></div>
        <p className="mt-6 text-sm font-semibold text-ink-3">{dateFmt(p.created_at)} · {p.author}</p>
        <h1 className="font-display mt-2 text-3xl font-semibold leading-tight sm:text-5xl">{p.title}</h1>
        <div className="prose-lite mt-6 whitespace-pre-line text-[17px]">{p.content}</div>
      </article>
      <Link to="/blog" className="mt-10 inline-flex items-center gap-1 font-bold text-brand-700">More guides <ArrowRight size={16} /></Link>
    </Wrap>
  );
}

export function Agents() {
  const { brand } = useApp(); useTitle("Our agents", brand.name);
  const { data, loading } = useFetch<{ items: { id: number; name: string; photo?: string; agency?: string; bio?: string; rera_id?: string; listings: number }[] }>("/api/agents");
  return (
    <>
      <PageHero title="Meet our advisors" sub="Local experts who know every street, society and price trend." />
      <Wrap><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-52 !rounded-3xl" />) : data?.items.map((a, i) => (
          <Reveal key={a.id} delay={i * 0.05}><div className="rounded-[28px] border border-line bg-white p-6 shadow-card">
            <div className="flex items-center gap-4">{a.photo ? <img src={a.photo} alt="" className="size-16 rounded-full object-cover" /> : <span className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-800 text-2xl font-extrabold text-white">{a.name[0]}</span>}
              <div><h3 className="text-lg font-extrabold">{a.name}</h3><p className="text-sm text-ink-3">{a.agency}</p></div></div>
            <p className="mt-4 text-sm leading-relaxed text-ink-2">{a.bio}</p>
            <div className="mt-4 flex items-center justify-between text-sm"><span className="font-bold text-brand-800">{a.listings} active listings</span>{a.rera_id && <span className="flex items-center gap-1 text-xs font-semibold text-ink-3"><BadgeCheck size={14} className="text-brand-600" />{a.rera_id}</span>}</div>
          </div></Reveal>
        ))}
      </div></Wrap>
    </>
  );
}

export function EmiPage() {
  const { brand } = useApp(); useTitle("EMI calculator", brand.name);
  return (<><PageHero title="Home loan EMI calculator" sub="Slide to see your monthly instalment, total interest and payable amount." /><Wrap narrow><div className="rounded-[32px] border border-line bg-white p-5 shadow-card sm:p-10"><EmiCalculator price={10000000} /></div></Wrap></>);
}

export function About() {
  const { brand } = useApp(); useTitle("About us", brand.name);
  return (<><PageHero title={`About ${brand.name}`} sub={brand.tagline} />
    <Wrap narrow><div className="prose-lite text-[17px]">
      <p>{brand.name} is a modern property marketplace built to make buying, selling and renting honest and effortless. We combine verified listings, direct owner connect and on-ground advisors so you never have to choose between convenience and trust.</p>
      <p>Every listing passes through a review before it goes live. Listings marked <b>Verified</b> have additional document and photo checks. We never ask for advance payments, and our advisors are measured on your satisfaction — not on closing quickly.</p>
    </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">{[[ShieldCheck, "Verified listings"], [Users, "Local advisors"], [Clock, "Fast responses"]].map(([I, t]: any) => <div key={t} className="rounded-3xl border border-line bg-white p-5 text-center shadow-card"><I className="mx-auto text-brand-600" /><div className="mt-2 font-extrabold">{t}</div></div>)}</div></Wrap></>);
}

export function Contact() {
  const { brand } = useApp(); useTitle("Contact", brand.name);
  const [sent, setSent] = useState(false); const [f, setF] = useState({ name: "", phone: "", email: "", message: "" }); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setErr(""); try { await api.post("/api/leads", { ...f, kind: "general", source: "contact" }); setSent(true); } catch (x: any) { setErr(x.message); } finally { setBusy(false); } };
  return (<><PageHero title="Contact us" sub="We usually reply within a few hours." />
    <Wrap><div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">{[[Phone, "Call us", brand.phone, `tel:${brand.phone.replace(/\s/g, "")}`], [Mail, "Email", brand.email, `mailto:${brand.email}`], [MapPin, "Office", brand.address, "#"], [Compass, "Hours", "Mon–Sat, 9:30 am – 7 pm", "#"]].map(([I, t, v, h]: any) => (
        <a key={t} href={h} className="flex items-center gap-4 rounded-3xl border border-line bg-white p-5 shadow-card"><span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><I size={22} /></span><div><div className="text-xs font-semibold text-ink-3">{t}</div><div className="font-extrabold">{v}</div></div></a>))}</div>
      <div className="rounded-[28px] border border-line bg-white p-6 shadow-card">
        {sent ? <div className="py-10 text-center"><Check className="mx-auto text-brand-600" size={48} /><h3 className="mt-3 text-xl font-extrabold">Message sent</h3><p className="text-ink-3">We'll get back to you shortly.</p></div> : (
          <form onSubmit={submit} className="space-y-4"><Field label="Name"><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field><Field label="Phone"><Input required type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field><Field label="Email"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field><Field label="How can we help?"><textarea className="input" required value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></Field>{err && <p className="text-sm font-medium text-danger">{err}</p>}<Button size="lg" full loading={busy} type="submit">Send message</Button></form>)}
      </div></div></Wrap></>);
}

export function Legal({ kind }: { kind: "terms" | "privacy" }) {
  const { brand } = useApp(); useTitle(kind === "terms" ? "Terms of use" : "Privacy policy", brand.name);
  const terms = kind === "terms";
  return (<><PageHero title={terms ? "Terms of use" : "Privacy policy"} sub="Last updated: November 2026" /><Wrap narrow><div className="prose-lite text-[16px]">
    {terms ? <><p>By using {brand.name} you agree to these terms. Listings are provided by owners, builders and agents; we review listings but do not guarantee the accuracy of every detail. Always verify documents and visit a property in person before making any payment.</p><p>You agree not to post false, misleading or unlawful listings, and not to misuse contact details obtained through the platform. We may remove listings or suspend accounts that violate these terms.</p><p>This is a template — have it reviewed by legal counsel before launch.</p></>
      : <><p>We collect the information you provide (name, phone, email, enquiries and listings) to operate the marketplace, connect you with owners and advisors, and improve our service. Sign-in is handled by Firebase Authentication.</p><p>We do not sell your personal data. Contact details are shared with a listing's owner or advisor only when you enquire or request their number. You can ask us to delete your account and data by writing to {brand.email}.</p><p>This is a template — have it reviewed by legal counsel before launch.</p></>}
  </div></Wrap></>);
}

export function NotFound() {
  return <Empty icon={<Building2 size={30} />} title="This page took a wrong turn" text="The page you're looking for doesn't exist or has moved." action={<Link to="/"><Button size="lg">Back to home</Button></Link>} />;
}
