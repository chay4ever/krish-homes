import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Building2, ExternalLink, FileText, FolderKanban, Inbox, LayoutDashboard, Lock, LogOut, Menu, Settings, ShieldCheck, UserCog, Users, X } from "lucide-react";
import { Button, Field, Input, Sheet, Spinner } from "@/components/ui";
import { LogoMark } from "@/components/Brand";
import { api } from "@/lib/api";
import { useApp } from "@/lib/app";
import { cx } from "@/lib/format";
import { ROLE_LABEL } from "../../shared/constants";
import type { StaffUser } from "@/lib/types";

interface StaffCtx { staff: StaffUser | null; loading: boolean; login: (e: string, p: string) => Promise<void>; logout: () => Promise<void>; reload: () => Promise<void> }
const Ctx = createContext<StaffCtx>(null as unknown as StaffCtx);
export const useStaff = () => useContext(Ctx);
export const isManager = (s: StaffUser | null) => s?.role === "super_admin" || s?.role === "admin";

export function StaffProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const reload = async () => { try { const r = await api.get<{ staff: StaffUser | null }>("/api/staff/me"); setStaff(r.staff); } catch { setStaff(null); } setLoading(false); };
  useEffect(() => { reload(); }, []);
  const login = async (email: string, password: string) => { const r = await api.post<{ staff: StaffUser }>("/api/staff/login", { email, password }); setStaff(r.staff); };
  const logout = async () => { await api.post("/api/staff/logout"); setStaff(null); };
  return <Ctx.Provider value={{ staff, loading, login, logout, reload }}>{children}</Ctx.Provider>;
}

export function AdminLogin() {
  const { staff, login, loading } = useStaff();
  const { brand } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { document.title = `Staff sign in · ${brand.name}`; }, [brand.name]);
  if (!loading && staff) return <Navigate to="/admin" replace />;
  return (
    <div className="bg-hero grid min-h-dvh place-items-center p-4">
      <motion.form initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(""); try { await login(email, password); nav("/admin"); } catch (x: any) { setErr(x.message); } finally { setBusy(false); } }}
        className="w-full max-w-sm space-y-4 rounded-[32px] bg-white p-7 shadow-2xl">
        <div className="text-center"><LogoMark size={56} className="mx-auto" /><h1 className="mt-4 text-2xl font-extrabold">Staff sign in</h1><p className="mt-1 text-sm text-ink-3">Super Admin · Admin Manager · Agent</p></div>
        <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" placeholder="you@company.com" /></Field>
        <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></Field>
        {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
        <Button type="submit" size="lg" full loading={busy}><Lock size={17} />Sign in</Button>
        <a href="/" className="block text-center text-sm font-semibold text-brand-700">← Back to website</a>
      </motion.form>
    </div>
  );
}

function ChangePassword({ forced, onClose }: { forced?: boolean; onClose: () => void }) {
  const { reload } = useStaff(); const { toast } = useApp();
  const [cur, setCur] = useState(""); const [next, setNext] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <Sheet open onClose={forced ? () => {} : onClose} title={forced ? "Set a new password" : "Change password"}>
      <form className="space-y-4 pt-2" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(""); try { await api.post("/api/staff/change-password", { current: cur, next }); await reload(); toast("Password updated"); onClose(); } catch (x: any) { setErr(x.message); } finally { setBusy(false); } }}>
        {forced && <p className="rounded-2xl bg-gold-100 p-3 text-sm font-medium text-gold-600">For security, please replace your temporary password before continuing.</p>}
        <Field label="Current password"><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} required autoComplete="current-password" /></Field>
        <Field label="New password" hint="8+ characters with letters and numbers"><Input type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} autoComplete="new-password" /></Field>
        {err && <p className="text-sm font-medium text-danger">{err}</p>}
        <Button type="submit" size="lg" full loading={busy}>Update password</Button>
      </form>
    </Sheet>
  );
}

export default function AdminLayout() {
  const { staff, loading, logout } = useStaff();
  const { brand } = useApp();
  const loc = useLocation();
  const [menu, setMenu] = useState(false); const [pw, setPw] = useState(false);
  useEffect(() => setMenu(false), [loc.pathname]);
  if (loading) return <div className="grid min-h-dvh place-items-center"><Spinner className="size-8" /></div>;
  if (!staff) return <Navigate to="/admin/login" replace />;
  const mgr = isManager(staff);
  const items = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true, show: true },
    { to: "/admin/properties", label: "Properties", icon: Building2, show: true },
    { to: "/admin/leads", label: "Leads", icon: Inbox, show: true },
    { to: "/admin/projects", label: "Projects", icon: FolderKanban, show: mgr },
    { to: "/admin/posts", label: "Blog posts", icon: FileText, show: mgr },
    { to: "/admin/users", label: "Users", icon: Users, show: mgr },
    { to: "/admin/staff", label: mgr ? "Team" : "Agents", icon: UserCog, show: true },
    { to: "/admin/settings", label: "Settings", icon: Settings, show: staff.role === "super_admin" },
  ].filter((i) => i.show);
  const bottom = items.slice(0, 3);

  const Nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => cx("flex items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-semibold transition", isActive ? "bg-white/12 text-white" : "text-white/60 hover:bg-white/8 hover:text-white")}><i.icon size={19} />{i.label}</NavLink>
      ))}
    </nav>
  );
  return (
    <div className="min-h-dvh bg-surface lg:grid lg:grid-cols-[260px_1fr]">
      {staff.must_change_password ? <ChangePassword forced onClose={() => {}} /> : pw && <ChangePassword onClose={() => setPw(false)} />}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-brand-950 p-5 lg:flex">
        <div className="mb-8 flex items-center gap-3 px-2"><LogoMark size={38} /><div><div className="font-extrabold text-white">{brand.name}</div><div className="text-[11px] font-bold uppercase tracking-wider text-gold-300">Console</div></div></div>
        {Nav}
        <div className="mt-4 rounded-2xl bg-white/8 p-3.5 text-white">
          <div className="truncate text-sm font-bold">{staff.name}</div><div className="mb-3 flex items-center gap-1 text-xs text-gold-300"><ShieldCheck size={12} />{ROLE_LABEL[staff.role]}</div>
          <div className="flex gap-2"><button onClick={() => setPw(true)} className="flex-1 rounded-xl bg-white/10 py-2 text-xs font-bold">Password</button><button onClick={logout} className="flex-1 rounded-xl bg-white/10 py-2 text-xs font-bold">Sign out</button></div>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 px-2 text-xs font-semibold text-white/50 hover:text-white"><ExternalLink size={13} />View website</a>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line px-4 pt-[var(--safe-t)] glass lg:hidden">
          <div className="flex items-center gap-2.5"><LogoMark size={30} /><span className="font-extrabold">Console</span></div>
          <button onClick={() => setMenu(true)} className="grid size-10 place-items-center rounded-full active:bg-black/5" aria-label="Menu"><Menu /></button>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:pb-12 lg:pt-8"><Outlet /></main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line pb-[var(--safe-b)] shadow-nav glass lg:hidden">
        {bottom.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => cx("flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold", isActive ? "text-brand-800" : "text-ink-3")}><i.icon size={22} />{i.label}</NavLink>
        ))}
        <button onClick={() => setMenu(true)} className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold text-ink-3"><Menu size={22} />More</button>
      </nav>
      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/50" onClick={() => setMenu(false)} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", damping: 32, stiffness: 320 }} className="absolute inset-y-0 right-0 flex w-72 flex-col bg-brand-950 p-5 pt-[calc(1.25rem+var(--safe-t))]">
            <button onClick={() => setMenu(false)} className="mb-4 ml-auto grid size-9 place-items-center rounded-full bg-white/10 text-white"><X size={18} /></button>
            {Nav}
            <div className="mt-4 space-y-2 text-white"><div className="px-2 text-sm font-bold">{staff.name}<div className="text-xs font-normal text-gold-300">{ROLE_LABEL[staff.role]}</div></div>
              <button onClick={() => { setMenu(false); setPw(true); }} className="w-full rounded-xl bg-white/10 py-2.5 text-sm font-bold">Change password</button>
              <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-bold"><LogOut size={16} />Sign out</button>
              <a href="/" className="block text-center text-xs text-white/50">View website</a></div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  useEffect(() => { document.title = `${title} · Console`; }, [title]);
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>{sub && <p className="mt-0.5 text-sm text-ink-3">{sub}</p>}</div>{action}</div>;
}
