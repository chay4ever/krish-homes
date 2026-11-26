import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Bell, Building2, Eye, Heart, Inbox, LogOut, MessageSquare, Pencil, Plus, Search, Trash2, User, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge, Button, Empty, Field, Input, Skeleton } from "@/components/ui";
import { Img } from "@/components/Img";
import { useApp } from "@/lib/app";
import { api } from "@/lib/api";
import { useFetch, useTitle } from "@/lib/hooks";
import { cx, dateFmt, inr, timeAgo } from "@/lib/format";
import type { Property } from "@/lib/types";

const TABS = [["profile", "Profile", User], ["listings", "My listings", Building2], ["enquiries", "Enquiries", Inbox], ["searches", "Saved searches", Bell]] as const;
const statusTone: Record<string, { l: string; t: "green" | "gold" | "red" | "gray"; i: typeof Clock }> = {
  active: { l: "Live", t: "green", i: CheckCircle2 }, pending: { l: "In review", t: "gold", i: Clock }, rejected: { l: "Rejected", t: "red", i: XCircle }, sold: { l: "Closed", t: "gray", i: CheckCircle2 }, archived: { l: "Archived", t: "gray", i: Clock }, draft: { l: "Draft", t: "gray", i: Clock },
};

export default function Account() {
  const { user, authLoading, openAuth, logout, brand, favIds } = useApp();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get("tab") ?? "profile";
  useTitle("My account", brand.name);
  if (authLoading) return <div className="mx-auto max-w-5xl px-4 py-8"><Skeleton className="h-40 w-full !rounded-3xl" /></div>;
  if (!user) return <Empty icon={<User size={30} />} title="Your account" text="Sign in to manage your listings, enquiries and saved searches." action={<Button size="lg" onClick={() => openAuth()}>Sign in / Sign up</Button>} />;
  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-10">
      <div className="bg-hero relative overflow-hidden rounded-[28px] p-5 text-white sm:p-8">
        <div className="relative flex items-center gap-4">
          {user.photo ? <img src={user.photo} alt="" referrerPolicy="no-referrer" className="size-16 rounded-full border-2 border-white/30 object-cover sm:size-20" /> : <span className="grid size-16 place-items-center rounded-full bg-white/15 text-2xl font-extrabold sm:size-20">{(user.name ?? "U")[0]}</span>}
          <div className="min-w-0"><h1 className="truncate text-xl font-extrabold sm:text-2xl">{user.name || "Welcome"}</h1><p className="truncate text-sm text-white/70">{user.email || user.phone}</p></div>
          <Link to="/saved" className="ml-auto hidden items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold sm:flex"><Heart size={16} />{favIds.size} saved</Link>
        </div>
      </div>
      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
        {TABS.map(([k, l, I]) => <button key={k} onClick={() => setSp({ tab: k }, { replace: true })} className={cx("flex shrink-0 items-center gap-2 rounded-full border-[1.5px] px-4 py-2.5 text-sm font-bold transition active:scale-95", tab === k ? "border-brand-700 bg-brand-700 text-white" : "border-line bg-white text-ink-2")}><I size={16} />{l}</button>)}
      </div>
      <div className="mt-5">
        {tab === "profile" && <Profile />}
        {tab === "listings" && <Listings />}
        {tab === "enquiries" && <Enquiries />}
        {tab === "searches" && <Searches />}
      </div>
      <button onClick={logout} className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-line bg-white py-3.5 text-sm font-bold text-danger active:scale-[0.98] lg:hidden"><LogOut size={17} />Sign out</button>
      <div className="mt-6 grid gap-3 text-center text-xs text-ink-3 lg:hidden"><span>{brand.name} · <Link to="/about" className="underline">About</Link> · <Link to="/contact" className="underline">Contact</Link> · <Link to="/terms" className="underline">Terms</Link> · <Link to="/privacy" className="underline">Privacy</Link></span></div>
    </div>
  );
}

function Profile() {
  const { user, refreshUser, toast } = useApp();
  const [name, setName] = useState(user?.name ?? ""); const [phone, setPhone] = useState(user?.phone ?? ""); const [email, setEmail] = useState(user?.email ?? ""); const [busy, setBusy] = useState(false);
  return (
    <form className="max-w-lg space-y-4 rounded-[28px] border border-line bg-white p-5 shadow-card sm:p-7" onSubmit={async (e) => { e.preventDefault(); setBusy(true); try { await api.put("/api/u/me", { name, phone, email }); await refreshUser(); toast("Profile updated"); } catch (x: any) { toast(x.message, "error"); } finally { setBusy(false); } }}>
      <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Mobile"><Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" /></Field>
      <Field label="Email"><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></Field>
      <Button size="lg" full loading={busy} type="submit">Save changes</Button>
    </form>
  );
}

function Listings() {
  const { toast } = useApp(); const nav = useNavigate();
  const { data, loading, reload } = useFetch<{ items: Property[] }>("/api/u/properties");
  const act = async (fn: () => Promise<unknown>, msg: string) => { try { await fn(); toast(msg); reload(); } catch (e: any) { toast(e.message, "error"); } };
  if (loading) return <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-32 !rounded-3xl" />)}</div>;
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Link to="/post-property"><Button><Plus size={18} />Post new property</Button></Link></div>
      {!data?.items.length ? <Empty icon={<Building2 size={30} />} title="No listings yet" text="Post your first property — it's free." action={<Link to="/post-property"><Button size="lg">Post property</Button></Link>} /> :
        data.items.map((p) => {
          const st = statusTone[p.status] ?? statusTone.draft;
          return (
            <div key={p.id} className="overflow-hidden rounded-3xl border border-line bg-white shadow-card sm:flex">
              <Link to={p.status === "active" ? `/property/${p.slug}` : "#"} className="block aspect-[16/9] shrink-0 sm:aspect-auto sm:w-52"><Img src={p.images[0]} alt={p.title} seed={p.slug} className="size-full" /></Link>
              <div className="min-w-0 flex-1 p-4">
                <div className="flex items-start justify-between gap-2"><h3 className="line-clamp-2 font-extrabold">{p.title}</h3><Badge tone={st.t}><st.i size={12} />{st.l}</Badge></div>
                <div className="mt-1 text-lg font-extrabold text-brand-800">{inr(p.price)}{p.listing_type === "rent" && "/mo"}</div>
                {p.status === "rejected" && p.reject_reason && <p className="mt-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">Reason: {p.reject_reason}</p>}
                <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-ink-3"><span className="flex items-center gap-1"><Eye size={14} />{p.views} views</span><span className="flex items-center gap-1"><MessageSquare size={14} />{p.leads ?? 0} enquiries</span><span>{timeAgo(p.created_at)}</span></div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => nav(`/post-property/${p.id}`)}><Pencil size={14} />Edit</Button>
                  {p.status === "active" && <Button size="sm" variant="soft" onClick={() => act(() => api.post(`/api/u/properties/${p.id}/status`, { status: "sold" }), "Marked as closed")}>Mark {p.listing_type === "rent" ? "rented" : "sold"}</Button>}
                  <Button size="sm" variant="ghost" className="!text-danger" onClick={() => confirm("Delete this listing permanently?") && act(() => api.del(`/api/u/properties/${p.id}`), "Listing deleted")}><Trash2 size={14} />Delete</Button>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

function Enquiries() {
  const { data, loading } = useFetch<{ sent: any[]; received: any[] }>("/api/u/leads");
  const [view, setView] = useState<"received" | "sent">("received");
  useEffect(() => { if (data && !data.received.length && data.sent.length) setView("sent"); }, [data]);
  if (loading) return <Skeleton className="h-40 !rounded-3xl" />;
  const list = (view === "received" ? data?.received : data?.sent) ?? [];
  return (
    <div>
      <div className="mb-4 inline-flex rounded-full bg-black/5 p-1">{([["received", "On my listings"], ["sent", "Sent by me"]] as const).map(([k, l]) => <button key={k} onClick={() => setView(k)} className={cx("rounded-full px-4 py-2 text-sm font-bold transition", view === k ? "bg-white shadow-card" : "text-ink-3")}>{l} ({(k === "received" ? data?.received : data?.sent)?.length ?? 0})</button>)}</div>
      {!list.length ? <Empty icon={<Inbox size={30} />} title="No enquiries yet" text={view === "received" ? "When someone enquires about your listing, it shows up here." : "Enquiries you send to owners show up here."} /> : (
        <div className="space-y-3">{list.map((l) => (
          <div key={l.id} className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="font-extrabold">{view === "received" ? l.name : l.title ?? "General enquiry"}</div>{view === "received" && <a href={`tel:${l.phone}`} className="text-sm font-bold text-brand-700">{l.phone}</a>}</div><Badge tone="gray">{l.kind}</Badge></div>
            {l.title && view === "received" && <Link to={`/property/${l.slug}`} className="mt-1 block truncate text-sm text-ink-3">{l.title}</Link>}
            {l.message && <p className="mt-2 text-sm text-ink-2">{l.message}</p>}
            {l.visit_at && <p className="mt-1 text-xs font-semibold text-gold-600">Visit: {new Date(l.visit_at).toLocaleString("en-IN")}</p>}
            <p className="mt-2 text-xs text-ink-3">{dateFmt(l.created_at)}{view === "sent" && l.status ? ` · ${l.status}` : ""}</p>
          </div>))}</div>)}
    </div>
  );
}

function Searches() {
  const { data, loading, reload } = useFetch<{ items: { id: number; name: string; query: string; created_at: string }[] }>("/api/u/saved-searches");
  if (loading) return <Skeleton className="h-32 !rounded-3xl" />;
  if (!data?.items.length) return <Empty icon={<Search size={30} />} title="No saved searches" text="Save a search from the results page to come back to it in one tap." action={<Link to="/search"><Button>Start searching</Button></Link>} />;
  return <div className="space-y-3">{data.items.map((s) => (
    <div key={s.id} className="flex items-center justify-between gap-3 rounded-3xl border border-line bg-white p-4 shadow-card"><Link to={`/search?${s.query}`} className="min-w-0 flex-1"><div className="truncate font-extrabold">{s.name}</div><div className="text-xs text-ink-3">Saved {dateFmt(s.created_at)}</div></Link><Button variant="ghost" size="sm" className="!text-danger" onClick={async () => { await api.del(`/api/u/saved-searches/${s.id}`); reload(); }}><Trash2 size={16} /></Button></div>))}</div>;
}
