import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, BadgeCheck, Building, Building2, Calculator, Home as HomeIcon, KeyRound, LandPlot, MapPin, PhoneCall, ShieldCheck, Sparkles, Store, Users, BedDouble, Briefcase } from "lucide-react";
import { SearchBox } from "@/components/SearchBox";
import { CardSkeleton, ProjectCard, PropertyCard } from "@/components/Cards";
import { Reveal } from "@/components/Reveal";
import { Img } from "@/components/Img";
import { SectionHead, Button } from "@/components/ui";
import { useApp } from "@/lib/app";
import { useFetch, useTitle } from "@/lib/hooks";
import { dateFmt } from "@/lib/format";
import type { Post, Project, Property } from "@/lib/types";

interface HomeData { featured: Property[]; latestSale: Property[]; latestRent: Property[]; projects: Project[]; posts: Post[]; stats: { properties: number; cities: number; users: number; projects: number } }

const QUICK = [
  { label: "Buy", icon: HomeIcon, to: "/search?type=sale", c: "bg-brand-50 text-brand-700" },
  { label: "Rent", icon: KeyRound, to: "/search?type=rent", c: "bg-gold-100 text-gold-600" },
  { label: "Plots", icon: LandPlot, to: "/search?category=plot", c: "bg-emerald-50 text-emerald-700" },
  { label: "Commercial", icon: Store, to: "/search?category=commercial", c: "bg-sky-50 text-sky-700" },
  { label: "PG", icon: BedDouble, to: "/search?pt=pg", c: "bg-rose-50 text-rose-600" },
  { label: "Projects", icon: Building2, to: "/projects", c: "bg-violet-50 text-violet-700" },
  { label: "EMI", icon: Calculator, to: "/emi-calculator", c: "bg-amber-50 text-amber-700" },
  { label: "Agents", icon: Users, to: "/agents", c: "bg-teal-50 text-teal-700" },
];

export default function Home() {
  const { brand, cities } = useApp();
  const { data, loading } = useFetch<HomeData>("/api/home");
  useTitle(undefined, `${brand.name} — ${brand.tagline}`);
  const stats = data?.stats;

  return (
    <div>
      {/* HERO */}
      <section className="bg-hero relative isolate overflow-hidden">
        <img src="/img/hero-skyline.webp" alt="" className="absolute inset-0 -z-10 size-full object-cover opacity-[0.18] mix-blend-luminosity" />
        <motion.div aria-hidden className="absolute -right-24 top-10 -z-10 size-72 rounded-full bg-gold-400/20 blur-3xl" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 9, repeat: Infinity }} />
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pb-20 sm:pt-16">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-gold-300 backdrop-blur"><Sparkles size={14} /> {stats ? `${stats.properties}+ verified listings across ${stats.cities} cities` : "Verified listings across India"}</span>
            <h1 className="font-display mt-5 text-[2.35rem] font-semibold leading-[1.05] text-white sm:text-6xl lg:text-7xl">{brand.heroTitle}</h1>
            <p className="mt-4 max-w-xl text-base text-white/70 sm:text-lg">{brand.heroSubtitle}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 mt-7 sm:mt-10">
            <SearchBox />
          </motion.div>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-white/75">
            {[[ShieldCheck, "Verified owners"], [BadgeCheck, "RERA-aware listings"], [PhoneCall, "Callbacks within hours"]].map(([I, t]: any) => <span key={t} className="flex items-center gap-2"><I size={17} className="text-gold-300" />{t}</span>)}
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-12">
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-8 sm:gap-4">
          {QUICK.map((q, i) => (
            <motion.div key={q.label} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
              <Link to={q.to} className="group flex flex-col items-center gap-2 rounded-3xl border border-line bg-white p-3 text-center shadow-card transition active:scale-95 sm:p-4 sm:hover:-translate-y-1 sm:hover:shadow-lift">
                <span className={`grid size-12 place-items-center rounded-2xl transition group-hover:scale-110 ${q.c}`}><q.icon size={23} /></span>
                <span className="text-[12.5px] font-bold sm:text-sm">{q.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto mt-12 max-w-7xl sm:mt-20 sm:px-6">
        <div className="px-4 sm:px-0"><SectionHead title="Handpicked for you" sub="Premium homes our team has personally vetted" action={<Link to="/search?sort=featured" className="hidden items-center gap-1 text-sm font-bold text-brand-700 sm:flex">View all <ArrowRight size={16} /></Link>} /></div>
        <div className="snap-row no-scrollbar px-4 sm:px-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible">
          {loading ? Array.from({ length: 3 }, (_, i) => <div key={i} className="w-[84%] sm:w-[360px] lg:w-auto"><CardSkeleton /></div>)
            : data?.featured.slice(0, 6).map((p) => <div key={p.id} className="w-[84%] sm:w-[360px] lg:w-auto"><PropertyCard p={p} /></div>)}
        </div>
      </section>

      {/* CITIES */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:mt-24 sm:px-6">
        <Reveal><SectionHead title="Explore top cities" sub="Jump straight into the neighbourhoods that matter" /></Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
          {cities.slice(0, 6).map((c, i) => (
            <Reveal key={c.id} delay={i * 0.05}>
              <Link to={`/search?city=${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-brand-800 shadow-card">
                <Img src={c.image} alt={c.name} seed={c.slug} className="size-full transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute inset-x-3 bottom-3 text-white"><div className="text-lg font-extrabold">{c.name}</div><div className="text-xs font-medium text-white/75">{c.listings ?? 0} properties</div></div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* LATEST SALE & RENT */}
      {[{ title: "Fresh on the market", sub: "New homes to buy", list: data?.latestSale, to: "/search?type=sale&sort=new" }, { title: "Ready to move in", sub: "Rental homes, listed this week", list: data?.latestRent, to: "/search?type=rent&sort=new" }].map((sec) => (
        <section key={sec.title} className="mx-auto mt-14 max-w-7xl sm:mt-24 sm:px-6">
          <div className="px-4 sm:px-0"><SectionHead title={sec.title} sub={sec.sub} action={<Link to={sec.to} className="flex items-center gap-1 text-sm font-bold text-brand-700">See all <ArrowRight size={16} /></Link>} /></div>
          <div className="snap-row no-scrollbar px-4 sm:px-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible">
            {loading ? Array.from({ length: 4 }, (_, i) => <div key={i} className="w-[84%] sm:w-[320px] lg:w-auto"><CardSkeleton /></div>)
              : sec.list?.slice(0, 4).map((p) => <div key={p.id} className="w-[84%] sm:w-[320px] lg:w-auto"><PropertyCard p={p} /></div>)}
          </div>
        </section>
      ))}

      {/* PROJECTS */}
      {!!data?.projects.length && (
        <section className="mt-14 bg-brand-950 py-12 sm:mt-24 sm:py-20">
          <div className="mx-auto max-w-7xl sm:px-6">
            <div className="px-4 sm:px-0"><SectionHead dark title="New launches" sub="Pre-launch pricing from trusted developers" action={<Link to="/projects" className="flex items-center gap-1 text-sm font-bold text-gold-300">All projects <ArrowRight size={16} /></Link>} /></div>
            <div className="snap-row no-scrollbar px-4 sm:px-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible">
              {data.projects.slice(0, 3).map((p) => <div key={p.id} className="w-[82%] sm:w-[340px] lg:w-auto"><ProjectCard p={p} /></div>)}
            </div>
          </div>
        </section>
      )}

      {/* WHY US */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:mt-24 sm:px-6">
        <Reveal><SectionHead title={`Why people choose ${brand.name}`} sub="Everything a modern property search should be" /></Reveal>
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          {[
            { i: ShieldCheck, t: "Verified, not just listed", d: "Our team checks ownership documents and site photos so you spend time on homes that are real." },
            { i: KeyRound, t: "Direct owner connect", d: "Talk straight to owners and builders. No middle-layers, no surprise fees — just clear conversations." },
            { i: PhoneCall, t: "Humans who pick up", d: "Book visits, get loan help and negotiation support from dedicated advisors in your city." },
          ].map((f, i) => (
            <Reveal key={f.t} delay={i * 0.08}>
              <div className="h-full rounded-[28px] border border-line bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
                <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700"><f.i size={26} /></span>
                <h3 className="mt-5 text-lg font-extrabold">{f.t}</h3><p className="mt-2 text-[15px] leading-relaxed text-ink-3">{f.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* POST CTA */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:mt-24 sm:px-6">
        <Reveal>
          <div className="bg-hero relative overflow-hidden rounded-[32px] p-7 sm:p-14">
            <motion.div aria-hidden className="absolute -right-10 -top-10 size-64 rounded-full bg-gold-400/25 blur-3xl" animate={{ x: [0, 20, 0] }} transition={{ duration: 8, repeat: Infinity }} />
            <div className="relative max-w-xl">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold-300">For owners & builders</span>
              <h2 className="font-display mt-3 text-3xl font-semibold text-white sm:text-5xl">Selling or renting out? List it free.</h2>
              <p className="mt-3 text-white/70 sm:text-lg">Reach thousands of verified buyers and tenants. Post in under 3 minutes, and track every enquiry from your account.</p>
              <div className="mt-7 flex flex-wrap gap-3"><Link to="/post-property"><Button variant="gold" size="lg">Post your property <ArrowRight size={18} /></Button></Link><Link to="/agents"><Button variant="ghost" size="lg" className="!text-white hover:!bg-white/10">Talk to an agent</Button></Link></div>
            </div>
            <Building size={280} strokeWidth={0.6} className="absolute -bottom-10 right-4 hidden text-white/10 lg:block" />
          </div>
        </Reveal>
      </section>

      {/* GUIDES */}
      {!!data?.posts.length && (
        <section className="mx-auto mt-14 max-w-7xl px-4 sm:mt-24 sm:px-6">
          <SectionHead title="Guides & insights" sub="Smart reading before a big decision" action={<Link to="/blog" className="flex items-center gap-1 text-sm font-bold text-brand-700">All guides <ArrowRight size={16} /></Link>} />
          <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
            {data.posts.map((p) => (
              <Link key={p.slug} to={`/blog/${p.slug}`} className="group overflow-hidden rounded-[26px] border border-line bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lift">
                <div className="aspect-[16/9] overflow-hidden"><Img src={p.cover} alt={p.title} seed={p.slug} className="size-full transition duration-700 group-hover:scale-105" /></div>
                <div className="p-5"><div className="text-xs font-semibold text-ink-3">{dateFmt(p.created_at)}</div><h3 className="mt-1.5 text-lg font-bold leading-snug">{p.title}</h3><p className="mt-2 line-clamp-2 text-sm text-ink-3">{p.excerpt}</p></div>
              </Link>
            ))}
          </div>
        </section>
      )}
      <div className="mx-auto mt-14 max-w-7xl px-4 text-center text-sm text-ink-3 sm:px-6 lg:hidden">
        <p className="flex items-center justify-center gap-1.5"><MapPin size={14} />{brand.address}</p>
        <p className="mt-1"><Briefcase size={13} className="mr-1 inline" />© {new Date().getFullYear()} {brand.name} · <Link to="/terms" className="underline">Terms</Link> · <Link to="/privacy" className="underline">Privacy</Link> · <Link to="/contact" className="underline">Contact</Link></p>
      </div>
    </div>
  );
}
