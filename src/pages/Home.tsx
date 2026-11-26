import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, BadgeCheck, Building2, Calculator, CalendarCheck, Wallet, Home as HomeIcon, KeyRound, LandPlot, MapPin, PhoneCall, ShieldCheck, Store, Users, BedDouble, Trees, Warehouse, ChevronDown } from "lucide-react";
import { SearchBox } from "@/components/SearchBox";
import { CardSkeleton, ProjectCard, PropertyCard } from "@/components/Cards";
import { Reveal } from "@/components/Reveal";
import { Img } from "@/components/Img";
import { Services } from "@/components/Services";
import { withCity } from "@/components/Layout";
import { SectionHead, Button } from "@/components/ui";
import { useApp } from "@/lib/app";
import { useFetch, useTitle } from "@/lib/hooks";
import { dateFmt } from "@/lib/format";
import type { Post, Project, Property } from "@/lib/types";

interface HomeData {
  city: { slug: string; name: string; state: string } | null;
  featured: Property[]; latestSale: Property[]; latestRent: Property[]; owner: Property[]; projects: Project[]; posts: Post[];
  stats: { properties: number; owners: number | null; sale: number | null; rent: number | null };
  types: { type: string; category: string; listing_type: string; n: number }[];
  localities: { name: string; slug: string; n: number }[];
  cities: { slug: string; name: string; state: string; image?: string; listings: number }[];
}

const Row = ({ children, cols = 4 }: { children: React.ReactNode; cols?: 3 | 4 }) => (
  <div className={`snap-row no-scrollbar px-4 sm:px-0 lg:grid lg:gap-5 lg:overflow-visible ${cols === 3 ? "lg:grid-cols-3 lg:gap-6" : "lg:grid-cols-4"}`}>{children}</div>
);
const Cell = ({ children, w = "sm:w-[320px]" }: { children: React.ReactNode; w?: string }) => <div className={`w-[84%] ${w} lg:w-auto`}>{children}</div>;

export default function Home() {
  const { brand, city, openPicker } = useApp();
  const slug = city?.slug;
  const { data, loading } = useFetch<HomeData>(`/api/home${slug ? `?city=${slug}` : ""}`);
  const where = city?.name ?? "Andhra Pradesh & Hyderabad";
  useTitle(city ? `Properties in ${city.name}` : undefined, brand.name);
  const s = data?.stats;
  const count = (pred: (t: HomeData["types"][number]) => boolean) => data?.types.filter(pred).reduce((a, t) => a + t.n, 0) ?? 0;
  const TYPES = [
    { c: "bg-sky-50 text-sky-700 group-hover:bg-sky-600", label: "Apartments", icon: Building2, to: "/search?pt=apartment,studio,penthouse,builder_floor", n: count((t) => ["apartment", "studio", "penthouse", "builder_floor"].includes(t.type)) },
    { c: "bg-orange-50 text-coral-600 group-hover:bg-coral-500", label: "Villas & houses", icon: HomeIcon, to: "/search?pt=villa,independent_house", n: count((t) => ["villa", "independent_house"].includes(t.type)) },
    { c: "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600", label: "Plots & land", icon: LandPlot, to: "/search?category=plot", n: count((t) => t.category === "plot") },
    { c: "bg-violet-50 text-violet-700 group-hover:bg-violet-600", label: "Commercial", icon: Store, to: "/search?category=commercial", n: count((t) => t.category === "commercial") },
    { c: "bg-rose-50 text-rose-600 group-hover:bg-rose-500", label: "PG & co-living", icon: BedDouble, to: "/search?pt=pg", n: count((t) => t.type === "pg") },
    { c: "bg-amber-50 text-amber-700 group-hover:bg-amber-600", label: "Farm & agri land", icon: Trees, to: "/search?pt=agri_land", n: count((t) => t.type === "agri_land") },
  ];
  const QUICK = [
    { label: "Buy", icon: HomeIcon, to: "/search?type=sale", c: "bg-brand-50 text-brand-700" },
    { label: "Rent", icon: KeyRound, to: "/search?type=rent", c: "bg-gold-100 text-gold-600" },
    { label: "Plots", icon: LandPlot, to: "/search?category=plot", c: "bg-emerald-50 text-emerald-700" },
    { label: "Commercial", icon: Warehouse, to: "/search?category=commercial", c: "bg-sky-50 text-sky-700" },
    { label: "PG", icon: BedDouble, to: "/search?pt=pg", c: "bg-rose-50 text-rose-600" },
    { label: "Projects", icon: Building2, to: "/projects", c: "bg-violet-50 text-violet-700" },
    { label: "EMI", icon: Calculator, to: "/emi-calculator", c: "bg-amber-50 text-amber-700" },
    { label: "Agents", icon: Users, to: "/agents", c: "bg-teal-50 text-teal-700" },
  ];
  const skel = (n: number, w?: string) => Array.from({ length: n }, (_, i) => <Cell key={i} w={w}><CardSkeleton /></Cell>);

  return (
    <div>
      {/* HERO */}
      <section className="bg-hero relative isolate overflow-hidden">
        <img src="/img/hero-skyline.webp" alt="" className="absolute inset-0 -z-10 size-full object-cover opacity-[0.18] mix-blend-luminosity" />
        <motion.div aria-hidden className="absolute -right-24 top-10 -z-10 size-72 rounded-full bg-gold-400/20 blur-3xl" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 9, repeat: Infinity }} />
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-7 sm:px-6 sm:pb-16 sm:pt-14">
          <motion.div key={where} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="max-w-3xl">
            <button onClick={openPicker} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-gold-300 backdrop-blur transition active:scale-95">
              <MapPin size={14} />{city ? `${s?.properties ?? "…"} properties in ${city.name}` : "Andhra Pradesh · Hyderabad"}<ChevronDown size={13} />
            </button>
            <h1 className="font-display mt-4 text-[2.2rem] font-semibold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
              {city ? <>Your dream home in <span className="text-gradient">{city.name}</span>, minus the broker</> : brand.heroTitle}
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/70 sm:text-lg">{city ? `Browse verified homes, plots and shops in ${city.name}. Call owners directly, book a free site visit and keep the commission in your pocket.` : brand.heroSubtitle}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 mt-6 sm:mt-9"><SearchBox /></motion.div>
          {!!data?.localities.length && (
            <div className="no-scrollbar mt-4 flex items-center gap-2 overflow-x-auto text-sm">
              <span className="shrink-0 font-semibold text-white/60">Popular in {city?.name}:</span>
              {data.localities.slice(0, 7).map((l) => <Link key={l.slug} to={`/search?city=${slug}&locality=${l.slug}`} className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-semibold text-white backdrop-blur transition hover:bg-white/20 active:scale-95">{l.name}</Link>)}
            </div>
          )}
        </div>
      </section>

      {/* HOOKS */}
      <section className="relative z-10 mx-auto -mt-6 max-w-7xl px-4 sm:-mt-9 sm:px-6">
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0">
          {[
            { i: BadgeCheck, t: "₹0 brokerage", d: "On every owner listing", c: "from-sky-500 to-cyan-500" },
            { i: ShieldCheck, t: "Verified homes", d: "Documents & photos checked", c: "from-emerald-500 to-teal-500" },
            { i: CalendarCheck, t: "Free site visits", d: "Booked in two taps", c: "from-coral-500 to-orange-400" },
            { i: Wallet, t: "Loan & legal help", d: "Best rates, zero paperwork stress", c: "from-violet-500 to-fuchsia-500" },
          ].map((h, i) => (
            <motion.div key={h.t} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.07 }} className="flex w-[78%] shrink-0 items-center gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-lift sm:w-auto sm:p-4">
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white ${h.c}`}><h.i size={21} /></span>
              <span className="min-w-0"><span className="block text-[15px] font-extrabold leading-tight">{h.t}</span><span className="block text-xs text-ink-3">{h.d}</span></span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8">
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-8 sm:gap-4">
          {QUICK.map((q, i) => (
            <motion.div key={q.label} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
              <Link to={withCity(q.to, slug)} className="group flex flex-col items-center gap-2 rounded-3xl border border-line bg-white p-3 text-center shadow-card transition active:scale-95 sm:p-4 sm:hover:-translate-y-1 sm:hover:shadow-lift">
                <span className={`grid size-12 place-items-center rounded-2xl transition group-hover:scale-110 ${q.c}`}><q.icon size={23} /></span>
                <span className="text-[12.5px] font-bold sm:text-sm">{q.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* STATS BAND */}
      {s && (
        <section className="mx-auto mt-8 max-w-7xl px-4 sm:mt-12 sm:px-6">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[26px] border border-line bg-line shadow-card sm:grid-cols-4">
            {[[s.properties, "Live properties", "text-brand-700"], [s.owners ?? 0, "Direct from owners", "text-sky-600"], [s.sale ?? 0, "Homes for sale", "text-coral-500"], [s.rent ?? 0, "Homes for rent", "text-violet-600"]].map(([n, l, tc]) => (
              <div key={String(l)} className="bg-white px-4 py-5 text-center"><div className={`text-2xl font-extrabold tabular sm:text-3xl ${tc}`}>{n}</div><div className="mt-0.5 text-xs font-semibold text-ink-3 sm:text-sm">{l}</div></div>
            ))}
          </div>
        </section>
      )}

      {/* EXPLORE BY TYPE */}
      <section className="mx-auto mt-12 max-w-7xl px-4 sm:mt-20 sm:px-6">
        <Reveal><SectionHead title={`Explore property types in ${where}`} sub="Jump straight to what you're looking for" /></Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
          {TYPES.map((t, i) => (
            <Reveal key={t.label} delay={i * 0.04}>
              <Link to={withCity(t.to, slug)} className="group flex h-full flex-col gap-3 rounded-3xl border border-line bg-white p-4 shadow-card transition active:scale-95 sm:hover:-translate-y-1 sm:hover:shadow-lift">
                <span className={`grid size-11 place-items-center rounded-2xl transition group-hover:text-white ${t.c}`}><t.icon size={21} /></span>
                <span><span className="block font-extrabold">{t.label}</span><span className="text-xs font-semibold text-ink-3">{loading ? "…" : `${t.n} listing${t.n === 1 ? "" : "s"}`}</span></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto mt-12 max-w-7xl sm:mt-20 sm:px-6">
        <div className="px-4 sm:px-0"><SectionHead title={city ? `Handpicked in ${city.name}` : "Handpicked for you"} sub="Premium homes our team has personally vetted" action={<Link to={withCity("/search?sort=featured", slug)} className="hidden items-center gap-1 text-sm font-bold text-brand-700 sm:flex">View all <ArrowRight size={16} /></Link>} /></div>
        <Row cols={3}>{loading ? skel(3, "sm:w-[360px]") : data?.featured.slice(0, 6).map((p) => <Cell key={p.id} w="sm:w-[360px]"><PropertyCard p={p} /></Cell>)}</Row>
      </section>

      {/* POPULAR LOCALITIES */}
      {!!data?.localities.length && (
        <section className="mx-auto mt-12 max-w-7xl px-4 sm:mt-20 sm:px-6">
          <Reveal><SectionHead title={`Popular localities in ${city?.name}`} sub="Browse neighbourhood by neighbourhood" /></Reveal>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {data.localities.map((l, i) => (
              <Reveal key={l.slug} delay={(i % 4) * 0.04}>
                <Link to={`/search?city=${slug}&locality=${l.slug}`} className="group flex items-center justify-between gap-2 rounded-2xl border border-line bg-white p-3.5 shadow-card transition active:scale-95 sm:p-4 sm:hover:border-brand-400 sm:hover:shadow-lift">
                  <span className="flex min-w-0 items-center gap-2.5"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><MapPin size={17} /></span><span className="min-w-0"><span className="block truncate text-sm font-extrabold">{l.name}</span><span className="text-xs font-semibold text-ink-3">{l.n} {l.n === 1 ? "property" : "properties"}</span></span></span>
                  <ArrowRight size={16} className="shrink-0 text-ink-3 transition group-hover:translate-x-0.5 group-hover:text-brand-700" />
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* OWNER / ZERO BROKERAGE */}
      {!!data?.owner.length && (
        <section className="bg-calm mt-12 py-10 sm:mt-20 sm:py-14">
          <div className="mx-auto max-w-7xl sm:px-6">
            <div className="px-4 sm:px-0"><SectionHead title="Skip the broker — talk to owners" sub="Zero brokerage. Zero commission. Direct phone numbers." action={<Link to={withCity("/search?owner=1", slug)} className="flex items-center gap-1 text-sm font-bold text-brand-700">See all <ArrowRight size={16} /></Link>} /></div>
            <Row>{data.owner.slice(0, 4).map((p) => <Cell key={p.id}><PropertyCard p={p} /></Cell>)}</Row>
          </div>
        </section>
      )}

      {/* LATEST */}
      {[{ title: city ? `New to buy in ${city.name}` : "Fresh on the market", sub: "Newly listed homes for sale", list: data?.latestSale, to: "/search?type=sale&sort=new" }, { title: city ? `Rentals in ${city.name}` : "Ready to move in", sub: "Rental homes, listed this week", list: data?.latestRent, to: "/search?type=rent&sort=new" }].map((sec) => (
        <section key={sec.title} className="mx-auto mt-12 max-w-7xl sm:mt-20 sm:px-6">
          <div className="px-4 sm:px-0"><SectionHead title={sec.title} sub={sec.sub} action={<Link to={withCity(sec.to, slug)} className="flex items-center gap-1 text-sm font-bold text-brand-700">See all <ArrowRight size={16} /></Link>} /></div>
          <Row>{loading ? skel(4) : sec.list?.slice(0, 4).map((p) => <Cell key={p.id}><PropertyCard p={p} /></Cell>)}</Row>
        </section>
      ))}

      {/* PROJECTS */}
      {!!data?.projects.length && (
        <section className="bg-navy mt-12 py-10 sm:mt-20 sm:py-16">
          <div className="mx-auto max-w-7xl sm:px-6">
            <div className="px-4 sm:px-0"><SectionHead dark title={city ? `New launches in ${city.name}` : "New launches"} sub="Pre-launch pricing from trusted developers" action={<Link to="/projects" className="flex items-center gap-1 text-sm font-bold text-gold-300">All projects <ArrowRight size={16} /></Link>} /></div>
            <Row cols={3}>{data.projects.slice(0, 3).map((p) => <Cell key={p.id} w="sm:w-[340px]"><ProjectCard p={p} /></Cell>)}</Row>
          </div>
        </section>
      )}

      {/* SERVICES */}
      <section className="bg-lilac mt-12 py-10 sm:mt-20 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal><SectionHead title="Moving? We handle the rest" sub="Loans, agreements, packers and interiors — one call, zero running around" /></Reveal>
          <Reveal><Services /></Reveal>
        </div>
      </section>

      {/* EXPLORE CITIES */}
      {!!data?.cities.length && (
        <section className="mx-auto mt-12 max-w-7xl px-4 sm:mt-20 sm:px-6">
          <Reveal><SectionHead title="Explore other cities" sub="Andhra Pradesh and Hyderabad" /></Reveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5 lg:grid-cols-6">
            {data.cities.filter((c) => c.slug !== slug).slice(0, 6).map((c, i) => (
              <Reveal key={c.slug} delay={i * 0.05}>
                <Link to={`/search?city=${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-brand-800 shadow-card">
                  <Img src={c.image} alt={c.name} seed={c.slug} className="size-full transition duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute inset-x-3 bottom-3 text-white"><div className="text-lg font-extrabold">{c.name}</div><div className="text-xs font-medium text-white/75">{c.listings} properties</div></div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* WHY US */}
      <section className="mx-auto mt-12 max-w-7xl px-4 sm:mt-20 sm:px-6">
        <Reveal><SectionHead title={`Why people choose ${brand.name}`} sub="Everything a modern property search should be" /></Reveal>
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          {[
            { c: "from-emerald-50 to-teal-100 text-emerald-700", i: ShieldCheck, t: "Verified, not just listed", d: "Our team checks ownership documents and site photos so you spend time on homes that are real." },
            { c: "from-sky-50 to-cyan-100 text-sky-700", i: KeyRound, t: "Direct owner connect", d: "Talk straight to owners and builders. No middle-layers, no surprise fees — just clear conversations." },
            { c: "from-orange-50 to-rose-100 text-coral-600", i: PhoneCall, t: "Humans who pick up", d: "Book visits, get loan help and negotiation support from dedicated advisors in your city." },
          ].map((f, i) => (
            <Reveal key={f.t} delay={i * 0.08}>
              <div className="h-full rounded-[28px] border border-line bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
                <span className={`grid size-14 place-items-center rounded-2xl bg-gradient-to-br ${f.c}`}><f.i size={26} /></span>
                <h3 className="mt-5 text-lg font-extrabold">{f.t}</h3><p className="mt-2 text-[15px] leading-relaxed text-ink-3">{f.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* POST CTA */}
      <section className="mx-auto mt-12 max-w-7xl px-4 sm:mt-20 sm:px-6">
        <Reveal>
          <div className="bg-sunset relative overflow-hidden rounded-[32px] p-7 sm:p-14">
            <motion.div aria-hidden className="absolute -right-10 -top-10 size-64 rounded-full bg-gold-400/25 blur-3xl" animate={{ x: [0, 20, 0] }} transition={{ duration: 8, repeat: Infinity }} />
            <div className="relative max-w-xl">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold-300">For owners & builders</span>
              <h2 className="font-display mt-3 text-3xl font-semibold text-white sm:text-5xl">Selling or renting{city ? ` in ${city.name}` : ""}? List it free. Skip the broker.</h2>
              <p className="mt-3 text-white/70 sm:text-lg">Reach verified buyers and tenants directly. Post in under 3 minutes, keep 100% of your price, and track every enquiry from your account.</p>
              <div className="mt-7 flex flex-wrap gap-3"><Link to="/post-property"><Button variant="coral" size="lg">Post your property — free <ArrowRight size={18} /></Button></Link><Link to="/agents"><Button variant="ghost" size="lg" className="!text-white hover:!bg-white/10">Talk to an agent</Button></Link></div>
            </div>
            <Building2 size={280} strokeWidth={0.6} className="absolute -bottom-10 right-4 hidden text-white/10 lg:block" />
          </div>
        </Reveal>
      </section>

      {/* GUIDES */}
      {!!data?.posts.length && (
        <section className="mx-auto mt-12 max-w-7xl px-4 sm:mt-20 sm:px-6">
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
      <div className="mx-auto mt-12 max-w-7xl px-4 text-center text-sm text-ink-3 sm:px-6 lg:hidden">
        <p className="flex items-center justify-center gap-1.5"><MapPin size={14} />{brand.address}</p>
        <p className="mt-1">© {new Date().getFullYear()} {brand.name} · <Link to="/terms" className="underline">Terms</Link> · <Link to="/privacy" className="underline">Privacy</Link> · <Link to="/contact" className="underline">Contact</Link></p>
      </div>
    </div>
  );
}
