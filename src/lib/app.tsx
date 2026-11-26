import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { api } from "./api";
import { DEFAULT_BRAND, type Brand } from "../../shared/constants";
import type { City, DbUser, Locality } from "./types";
import { firebaseSignOut, initFirebase, onFirebaseUser, firebaseReady } from "./firebase";
import AuthModal from "@/components/AuthModal";
import LocationPicker from "@/components/LocationPicker";

type ToastKind = "success" | "error" | "info";
interface Ctx {
  brand: Brand; cities: City[]; localities: Locality[]; firebaseEnabled: boolean; booting: boolean;
  city: City | null; selectCity: (slug: string | null) => void; pickerOpen: boolean; openPicker: () => void; closePicker: () => void;
  user: DbUser | null; authLoading: boolean; openAuth: (reason?: string) => void; logout: () => Promise<void>; refreshUser: () => Promise<void>;
  favIds: Set<number>; toggleFav: (id: number) => Promise<void>; requireAuth: (reason: string, fn: () => void) => void;
  toast: (msg: string, kind?: ToastKind) => void;
}
const AppCtx = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<Brand>(DEFAULT_BRAND);
  const [cities, setCities] = useState<City[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [firebaseEnabled, setFirebaseEnabled] = useState(false);
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<DbUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState<string | null>(null);
  const [citySlug, setCitySlug] = useState<string | null>(() => { try { return localStorage.getItem("kh_city"); } catch { return null; } });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: ToastKind }[]>([]);
  const tid = useRef(0);

  const toast = useCallback((msg: string, kind: ToastKind = "success") => {
    const id = ++tid.current;
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const [me, favs] = await Promise.all([api.get<{ user: DbUser }>("/api/u/me"), api.get<{ ids: number[] }>("/api/u/favorites/ids")]);
      setUser(me.user); setFavIds(new Set(favs.ids));
    } catch { setUser(null); setFavIds(new Set()); }
  }, []);

  useEffect(() => {
    let off: (() => void) | undefined;
    (async () => {
      const [cfg, meta] = await Promise.all([
        api.get<{ brand: Brand; firebase: any }>("/api/config").catch(() => null),
        api.get<{ cities: City[]; localities: Locality[] }>("/api/meta").catch(() => null),
      ]);
      if (cfg) { setBrand(cfg.brand); }
      if (meta) { setCities(meta.cities); setLocalities(meta.localities); }
      if (cfg?.firebase) {
        await initFirebase(cfg.firebase);
        setFirebaseEnabled(firebaseReady());
        off = await onFirebaseUser(async (u) => {
          await loadUser();
          setAuthLoading(false);
        });
      } else { await loadUser(); setAuthLoading(false); }
      setBooting(false);
    })();
    return () => off?.();
  }, [loadUser]);

  const city = useMemo(() => cities.find((c) => c.slug === citySlug) ?? null, [cities, citySlug]);
  const selectCity = useCallback((slug: string | null) => {
    setCitySlug(slug);
    try { slug ? localStorage.setItem("kh_city", slug) : localStorage.removeItem("kh_city"); localStorage.setItem("kh_city_asked", "1"); } catch { /* private mode */ }
    setPickerOpen(false);
  }, []);
  const openPicker = useCallback(() => setPickerOpen(true), []);
  const closePicker = useCallback(() => { try { localStorage.setItem("kh_city_asked", "1"); } catch { /* ignore */ } setPickerOpen(false); }, []);
  // First visit: ask for a city once (like NoBroker / 99acres), after the app has loaded.
  useEffect(() => {
    if (booting || !cities.length) return;
    try { if (!localStorage.getItem("kh_city") && !localStorage.getItem("kh_city_asked") && !location.pathname.startsWith("/admin")) setPickerOpen(true); } catch { /* ignore */ }
  }, [booting, cities.length]);

  const logout = useCallback(async () => { await firebaseSignOut(); await api.post("/api/auth/logout").catch(() => {}); setUser(null); setFavIds(new Set()); toast("Signed out", "info"); }, [toast]);
  const openAuth = useCallback((reason?: string) => setAuthOpen(reason ?? ""), []);
  const requireAuth = useCallback((reason: string, fn: () => void) => { if (user) fn(); else setAuthOpen(reason); }, [user]);

  const toggleFav = useCallback(async (id: number) => {
    if (!user) { setAuthOpen("Sign in to save properties to your shortlist"); return; }
    const had = favIds.has(id);
    setFavIds((s) => { const n = new Set(s); had ? n.delete(id) : n.add(id); return n; });
    try { had ? await api.del(`/api/u/favorites/${id}`) : await api.put(`/api/u/favorites/${id}`); toast(had ? "Removed from shortlist" : "Saved to your shortlist", had ? "info" : "success"); }
    catch (e: any) { setFavIds((s) => { const n = new Set(s); had ? n.add(id) : n.delete(id); return n; }); toast(e.message, "error"); }
  }, [user, favIds, toast]);

  const value = useMemo(() => ({ city, selectCity, pickerOpen, openPicker, closePicker, brand, cities, localities, firebaseEnabled, booting, user, authLoading, openAuth, logout, refreshUser: loadUser, favIds, toggleFav, requireAuth, toast }),
    [city, selectCity, pickerOpen, openPicker, closePicker, brand, cities, localities, firebaseEnabled, booting, user, authLoading, openAuth, logout, loadUser, favIds, toggleFav, requireAuth, toast]);

  return (
    <AppCtx.Provider value={value}>
      {children}
      <LocationPicker />
      <AuthModal open={authOpen !== null} reason={authOpen ?? ""} onClose={() => setAuthOpen(null)} onDone={async () => { await loadUser(); setAuthOpen(null); toast("Welcome! You're signed in."); }} />
      <div className="pointer-events-none fixed inset-x-0 top-[calc(var(--safe-t)+12px)] z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:top-auto lg:items-end lg:pr-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: -16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-lift">
              {t.kind === "success" ? <CheckCircle2 size={18} className="text-brand-300" /> : t.kind === "error" ? <AlertCircle size={18} className="text-red-300" /> : <Info size={18} className="text-gold-300" />}
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AppCtx.Provider>
  );
}
