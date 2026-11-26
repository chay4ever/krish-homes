import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ChevronDown, ChevronLeft, Heart, Home, LogOut, MapPin, PlusCircle, Search, User, UserCircle2, Phone, Mail, Building2 } from "lucide-react";
import { Logo } from "./Brand";
import { Button } from "./ui";
import { useApp } from "@/lib/app";
import { cx } from "@/lib/format";

const NAV = [
  { to: "/search?type=sale", label: "Buy" },
  { to: "/search?type=rent", label: "Rent" },
  { to: "/search?category=commercial", label: "Commercial" },
  { to: "/projects", label: "Projects" },
  { to: "/agents", label: "Agents" },
  { to: "/blog", label: "Guides" },
  { to: "/emi-calculator", label: "EMI Calculator" },
];

export const withCity = (to: string, slug?: string) => (slug && to.startsWith("/search") ? to + (to.includes("?") ? "&" : "?") + "city=" + slug : to);

export function CityPill({ className }: { className?: string }) {
  const { city, openPicker } = useApp();
  return (
    <button onClick={openPicker} aria-label="Change city" className={cx("flex min-w-0 shrink items-center gap-1.5 rounded-full border-[1.5px] border-brand-200 bg-brand-50 px-3.5 py-2 text-sm font-bold text-brand-900 transition hover:border-brand-400 active:scale-95", className)}>
      <MapPin size={15} className="text-brand-600" /><span className="max-w-[110px] truncate max-[380px]:max-w-[84px] sm:max-w-[120px]">{city?.name ?? "Select city"}</span><ChevronDown size={14} />
    </button>
  );
}

function DesktopHeader() {
  const { user, openAuth, logout, favIds, city } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [loc.pathname]);
  return (
    <header className="sticky top-0 z-40 hidden border-b border-line/70 glass lg:block">
      <div className="stripe" />
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 xl:gap-8 xl:px-6">
        <div className="flex shrink-0 items-center gap-3 xl:gap-4"><Logo className="shrink-0 whitespace-nowrap" /><CityPill /></div>
        <nav className="flex min-w-0 items-center gap-0.5 xl:gap-1">
          {NAV.slice(0, 5).map((n) => (
            <Link key={n.to} to={withCity(n.to, city?.slug)} className={cx("whitespace-nowrap rounded-full px-3 py-2 text-[15px] font-semibold text-ink-2 transition hover:bg-brand-50 hover:text-brand-800 xl:px-4", n.label === "Agents" && "hidden 2xl:block")}>{n.label}</Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link to="/saved" className="relative grid size-11 place-items-center rounded-full text-ink-2 transition hover:bg-brand-50" aria-label="Saved">
            <Heart size={21} />{favIds.size > 0 && <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-danger text-[10px] font-bold text-white">{favIds.size}</span>}
          </Link>
          <Button variant="coral" className="whitespace-nowrap" onClick={() => nav("/post-property")}><PlusCircle size={18} /> Post<span className="hidden xl:inline"> property</span> <span className="hidden rounded-md bg-gold-400 px-1.5 py-0.5 text-[10px] font-extrabold text-ink xl:inline">FREE</span></Button>
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
            <Button className="whitespace-nowrap" onClick={() => openAuth()}>Login<span className="hidden xl:inline"> / Sign up</span></Button>
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
  const { user } = useApp();
  const isRoot = ROOT_PATHS.includes(pathname);
  const hide = pathname.startsWith("/property/") || pathname.startsWith("/project/");
  if (hide) return null;
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 pt-[var(--safe-t)] glass lg:hidden">
      <div className="stripe -mt-[var(--safe-t)]" />
      <div className="flex h-14 items-center justify-between gap-2 px-3 min-[380px]:px-4">
        {isRoot ? <Logo /> : (
          <button onClick={() => (window.history.length > 1 ? nav(-1) : nav("/"))} className="-ml-2 flex items-center gap-1 rounded-full py-2 pl-1 pr-3 text-[15px] font-bold active:bg-black/5"><ChevronLeft size={24} />Back</button>
        )}
        <div className="flex min-w-0 items-center gap-1.5">
          {isRoot && <CityPill className="!gap-1 !px-2.5 !py-1.5 !text-xs" />}
          {user && <Link to="/account" className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-50">{user.photo ? <img src={user.photo} alt="" className="size-9 object-cover" referrerPolicy="no-referrer" /> : <User size={18} className="text-brand-700" />}</Link>}
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
  const { favIds, city } = useApp();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line/70 pb-[var(--safe-b)] shadow-nav glass lg:hidden" aria-label="Primary">
      <LayoutGroup id="tabs">
        <ul className="mx-auto grid h-[64px] max-w-md grid-cols-5 items-center px-1">
          {TABS.map((t) => {
            const active = t.match(pathname);
            return (
              <li key={t.to} className="relative flex justify-center">
                <NavLink to={withCity(t.to, city?.slug)} className="flex flex-col items-center gap-0.5 px-1 py-1.5 sm:px-3" aria-label={t.label}>
                  {t.fab ? (
                    <motion.span whileTap={{ scale: 0.88 }} className="-mt-7 grid size-14 place-items-center rounded-full bg-gradient-to-br from-coral-400 via-coral-500 to-violet-600 text-white shadow-lift ring-4 ring-surface">
                      <PlusCircle size={26} strokeWidth={2.2} />
                    </motion.span>
                  ) : (
                    <motion.span whileTap={{ scale: 0.85 }} className="relative grid h-8 w-12 place-items-center sm:w-14">
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
    <footer className="bg-navy mt-16 hidden text-white/80 lg:block">
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
        <FooterCol title="Popular cities" links={cities.slice(0, 7).map((c) => [`Property in ${c.name}`, `/search?city=${c.slug}`])} />
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
