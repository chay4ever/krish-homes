import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ChevronLeft, Heart, Home, LogOut, MapPin, PlusCircle, Search, User, UserCircle2, Phone, Mail, Building2 } from "lucide-react";
import { Logo } from "./Brand";
import { Button } from "./ui";
import { useApp } from "@/lib/app";
import { cx } from "@/lib/format";

const NAV = [
  { to: "/search?type=sale", label: "Buy" },
  { to: "/search?type=rent", label: "Rent" },
  { to: "/search?category=commercial", label: "Commercial" },
  { to: "/projects", label: "New Projects" },
  { to: "/agents", label: "Agents" },
  { to: "/blog", label: "Guides" },
  { to: "/emi-calculator", label: "EMI Calculator" },
];

function DesktopHeader() {
  const { user, openAuth, logout, favIds } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [loc.pathname]);
  return (
    <header className="sticky top-0 z-40 hidden border-b border-line/70 glass lg:block">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-8 px-6">
        <Logo />
        <nav className="flex items-center gap-1">
          {NAV.slice(0, 5).map((n) => (
            <Link key={n.to} to={n.to} className="rounded-full px-4 py-2 text-[15px] font-semibold text-ink-2 transition hover:bg-brand-50 hover:text-brand-800">{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/saved" className="relative grid size-11 place-items-center rounded-full text-ink-2 transition hover:bg-brand-50" aria-label="Saved">
            <Heart size={21} />{favIds.size > 0 && <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-danger text-[10px] font-bold text-white">{favIds.size}</span>}
          </Link>
          <Button variant="outline" onClick={() => nav("/post-property")}><PlusCircle size={18} /> Post property <span className="rounded-md bg-gold-400 px-1.5 py-0.5 text-[10px] font-extrabold text-ink">FREE</span></Button>
          {user ? (
            <div className="relative">
              <button onClick={() => setMenu(!menu)} className="flex items-center gap-2 rounded-full border-[1.5px] border-line bg-white py-1 pl-1 pr-3 transition hover:border-brand-400">
                {user.photo ? <img src={user.photo} alt="" className="size-8 rounded-full object-cover" referrerPolicy="no-referrer" /> : <UserCircle2 size={32} className="text-brand-600" />}
                <span className="max-w-[110px] truncate text-sm font-bold">{user.name?.split(" ")[0] || "Account"}</span>
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6 }} className="absolute right-0 top-14 w-56 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-lift">
                    {[["/account", "My account", User], ["/account?tab=listings", "My listings", Building2], ["/saved", "Shortlist", Heart]].map(([to, l, I]: any) => (
                      <Link key={to} to={to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-brand-50"><I size={17} className="text-brand-600" />{l}</Link>
                    ))}
                    <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-danger hover:bg-red-50"><LogOut size={17} />Sign out</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Button onClick={() => openAuth()}>Login / Sign up</Button>
          )}
        </div>
      </div>
    </header>
  );
}

const ROOT_PATHS = ["/", "/search", "/saved", "/account", "/projects"];
function MobileTopBar() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { user, openAuth, cities } = useApp();
  const isRoot = ROOT_PATHS.includes(pathname);
  const hide = pathname.startsWith("/property/") || pathname.startsWith("/project/");
  if (hide) return null;
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 pt-[var(--safe-t)] glass lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        {isRoot ? <Logo /> : (
          <button onClick={() => (window.history.length > 1 ? nav(-1) : nav("/"))} className="-ml-2 flex items-center gap-1 rounded-full py-2 pl-1 pr-3 text-[15px] font-bold active:bg-black/5"><ChevronLeft size={24} />Back</button>
        )}
        <div className="flex items-center gap-1.5">
          {isRoot && <Link to="/search" className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-800"><MapPin size={14} />{cities[0]?.name ?? "India"}</Link>}
          {user ? <Link to="/account" className="grid size-9 place-items-center overflow-hidden rounded-full bg-brand-50">{user.photo ? <img src={user.photo} alt="" className="size-9 object-cover" referrerPolicy="no-referrer" /> : <User size={18} className="text-brand-700" />}</Link>
            : <button onClick={() => openAuth()} className="rounded-full bg-brand-700 px-4 py-2 text-sm font-bold text-white active:scale-95">Login</button>}
        </div>
      </div>
    </header>
  );
}

const TABS = [
  { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { to: "/search", label: "Search", icon: Search, match: (p: string) => p.startsWith("/search") || p.startsWith("/property") },
  { to: "/post-property", label: "Post", icon: PlusCircle, fab: true, match: (p: string) => p.startsWith("/post-property") },
  { to: "/saved", label: "Saved", icon: Heart, match: (p: string) => p.startsWith("/saved") },
  { to: "/account", label: "Account", icon: User, match: (p: string) => p.startsWith("/account") },
];
function BottomNav() {
  const { pathname } = useLocation();
  const { favIds } = useApp();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line/70 pb-[var(--safe-b)] shadow-nav glass lg:hidden" aria-label="Primary">
      <LayoutGroup id="tabs">
        <ul className="mx-auto grid h-[64px] max-w-md grid-cols-5 items-center px-2">
          {TABS.map((t) => {
            const active = t.match(pathname);
            return (
              <li key={t.to} className="relative flex justify-center">
                <NavLink to={t.to} className="flex flex-col items-center gap-0.5 px-3 py-1.5" aria-label={t.label}>
                  {t.fab ? (
                    <motion.span whileTap={{ scale: 0.88 }} className="-mt-7 grid size-14 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-lift ring-4 ring-surface">
                      <PlusCircle size={26} strokeWidth={2.2} />
                    </motion.span>
                  ) : (
                    <motion.span whileTap={{ scale: 0.85 }} className="relative grid h-8 w-14 place-items-center">
                      {active && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-brand-100" transition={{ type: "spring", stiffness: 480, damping: 34 }} />}
                      <t.icon size={22} strokeWidth={active ? 2.5 : 2} className={cx("relative", active ? "text-brand-800" : "text-ink-3")} fill={active && t.to === "/saved" ? "currentColor" : "none"} />
                      {t.to === "/saved" && favIds.size > 0 && <span className="absolute right-2 top-0 grid size-4 place-items-center rounded-full bg-danger text-[9px] font-bold text-white">{favIds.size}</span>}
                    </motion.span>
                  )}
                  <span className={cx("text-[11px] font-bold", t.fab ? "text-brand-800" : active ? "text-brand-800" : "text-ink-3")}>{t.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </LayoutGroup>
    </nav>
  );
}

function Footer() {
  const { brand, cities } = useApp();
  return (
    <footer className="mt-16 hidden bg-brand-950 text-white/80 lg:block">
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-10 px-6 py-16">
        <div className="col-span-4">
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">{brand.tagline}. Verified listings, zero-hassle visits and honest advice — from first search to keys in hand.</p>
          <div className="mt-6 space-y-2 text-sm">
            <a href={`tel:${brand.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-white"><Phone size={15} />{brand.phone}</a>
            <a href={`mailto:${brand.email}`} className="flex items-center gap-2 hover:text-white"><Mail size={15} />{brand.email}</a>
            <p className="flex items-center gap-2"><MapPin size={15} />{brand.address}</p>
          </div>
        </div>
        <FooterCol title="Explore" links={[["Buy property", "/search?type=sale"], ["Rent property", "/search?type=rent"], ["Commercial", "/search?category=commercial"], ["Plots & land", "/search?category=plot"], ["New projects", "/projects"]]} />
        <FooterCol title="Popular cities" links={cities.slice(0, 6).map((c) => [`Property in ${c.name}`, `/search?city=${c.slug}`])} />
        <FooterCol title="Company" links={[["About us", "/about"], ["Contact", "/contact"], ["Agents", "/agents"], ["Guides & blog", "/blog"], ["EMI calculator", "/emi-calculator"], ["Staff login", "/admin"]]} />
        <FooterCol title="Legal" links={[["Terms of use", "/terms"], ["Privacy policy", "/privacy"]]} />
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/45">© {new Date().getFullYear()} {brand.name}. All rights reserved.</div>
    </footer>
  );
}
const FooterCol = ({ title, links }: { title: string; links: string[][] }) => (
  <div className="col-span-2">
    <h4 className="mb-4 text-sm font-bold text-white">{title}</h4>
    <ul className="space-y-2.5 text-sm">{links.map(([l, to]) => <li key={to + l}><Link to={to} className="text-white/60 transition hover:text-gold-300">{l}</Link></li>)}</ul>
  </div>
);

export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  const hideNav = pathname.startsWith("/post-property") || pathname.startsWith("/property/");
  return (
    <div className="min-h-dvh">
      <ScrollToTop />
      <DesktopHeader />
      <MobileTopBar />
      <main className={cx(!hideNav && "pb-nav")}>
        <PageTransition><Outlet /></PageTransition>
      </main>
      <Footer />
      {!hideNav && <BottomNav />}
    </div>
  );
}
