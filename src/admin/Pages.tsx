import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Building2, Check, Download, Eye, Inbox, Pencil, Plus, Search, Star, Trash2, TrendingUp, Users, X, BadgeCheck, Phone } from "lucide-react";
import { PageTitle, isManager, useStaff } from "./Admin";
import { Badge, Button, Chip, Empty, Sheet, Skeleton, Stat, Field, Input } from "@/components/ui";
import { PropertyForm, fromProperty, toPayload } from "@/components/PropertyForm";
import { Img } from "@/components/Img";
import { api } from "@/lib/api";
import { useApp } from "@/lib/app";
import { useDebounced, useFetch } from "@/lib/hooks";
import { cx, dateFmt, inr, timeAgo } from "@/lib/format";
import { LEAD_STATUSES, PROPERTY_STATUSES, typeLabel } from "../../shared/constants";

const leadTone: Record<string, "brand" | "gold" | "gray" | "green" | "red"> = { new: "gold", contacted: "brand", qualified: "brand", visit_done: "green", closed: "green", lost: "red" };
const propTone: Record<string, "brand" | "gold" | "gray" | "green" | "red"> = { active: "green", pending: "gold", rejected: "red", sold: "gray", archived: "gray", draft: "gray" };

export function Dashboard() {
  const { staff } = useStaff();
  const { data, loading } = useFetch<any>("/api/admin/stats");
  if (loading || !data) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 !rounded-3xl" />)}</div>;
  const days: { d: string; n: number }[] = data.leadsByDay; const max = Math.max(1, ...days.map((d) => d.n));
  return (
    <div>
      <PageTitle title={`Hello, ${staff!.name.split(" ")[0]} 👋`} sub={isManager(staff) ? "Here's how the marketplace is doing" : "Your listings and leads at a glance"} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Live listings" value={data.props.active ?? 0} icon={<Building2 size={18} />} />
        <Stat label="Pending review" value={data.props.pending ?? 0} icon={<Eye size={18} />} tone="gold" />
        <Stat label="New leads" value={data.leads.new ?? 0} icon={<Inbox size={18} />} tone="gold" />
        <Stat label={isManager(staff) ? "Registered users" : "Total views"} value={isManager(staff) ? data.users?.total ?? 0 : data.props.views} icon={<Users size={18} />} tone="ink" />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-line bg-white p-5 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between"><h3 className="font-extrabold">Leads · last 14 days</h3><span className="flex items-center gap-1 text-sm font-bold text-brand-700"><TrendingUp size={16} />{data.leads.week ?? 0} this week</span></div>
          {days.length === 0 ? <p className="py-10 text-center text-sm text-ink-3">No leads yet.</p> : (
            <div className="flex h-40 items-end gap-2">{days.map((d) => <div key={d.d} className="group flex flex-1 flex-col items-center justify-end gap-1"><span className="text-[10px] font-bold text-ink-3 opacity-0 group-hover:opacity-100">{d.n}</span><div className="w-full rounded-t-lg bg-gradient-to-t from-brand-700 to-brand-400 transition-all" style={{ height: `${(d.n / max) * 100}%`, minHeight: 6 }} /><span className="text-[9px] text-ink-3">{d.d.slice(8)}</span></div>)}</div>)}
        </div>
        <div className="rounded-3xl border border-line bg-white p-5 shadow-card">
          <h3 className="mb-4 font-extrabold">Top cities</h3>
          <ul className="space-y-3">{data.topCities.map((c: any) => <li key={c.name}><div className="mb-1 flex justify-between text-sm font-semibold"><span>{c.name}</span><span>{c.n}</span></div><div className="h-2 rounded-full bg-black/5"><div className="h-full rounded-full bg-gold-400" style={{ width: `${(c.n / data.topCities[0].n) * 100}%` }} /></div></li>)}</ul>
        </div>
      </div>
      <div className="mt-5 rounded-3xl border border-line bg-white p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between"><h3 className="font-extrabold">Recent leads</h3><Link to="/admin/leads" className="text-sm font-bold text-brand-700">View all</Link></div>
        {!data.recentLeads.length ? <p className="py-6 text-center text-sm text-ink-3">Leads will show here as they arrive.</p> : <ul className="divide-y divide-line">{data.recentLeads.map((l: any) => <li key={l.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><div className="truncate text-sm font-bold">{l.name} <span className="font-medium text-ink-3">· {l.phone}</span></div><div className="truncate text-xs text-ink-3">{l.title ?? "General"} · {timeAgo(l.created_at)}</div></div><Badge tone={leadTone[l.status]}>{l.status}</Badge></li>)}</ul>}
      </div>
    </div>
  );
}

export function AdminProperties() {
  const { staff } = useStaff(); const { toast } = useApp();
  const mgr = isManager(staff);
  const [status, setStatus] = useState(mgr ? "pending" : ""); const [q, setQ] = useState(""); const dq = useDebounced(q); const [page, setPage] = useState(1);
  const { data, loading, reload } = useFetch<{ items: any[]; total: number; limit: number }>(`/api/admin/properties?page=${page}&status=${status}&q=${encodeURIComponent(dq)}`);
  const [reject, setReject] = useState<any>(null); const [reason, setReason] = useState("");
  const act = async (fn: () => Promise<unknown>, msg: string) => { try { await fn(); toast(msg); reload(); } catch (e: any) { toast(e.message, "error"); } };
  useEffect(() => setPage(1), [status, dq]);
  return (
    <div>
      <PageTitle title="Properties" sub={`${data?.total ?? 0} listings`} action={<Link to="/admin/properties/new"><Button><Plus size={18} />Add property</Button></Link>} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" /><input className="input !pl-10" placeholder="Search title, owner…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">{[{ value: "", label: "All" }, ...PROPERTY_STATUSES.filter((s) => s.value !== "draft")].map((s) => <Chip key={s.value} active={status === s.value} onClick={() => setStatus(s.value)}>{s.label}</Chip>)}</div>
      </div>
      {loading ? <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 !rounded-3xl" />)}</div> : !data?.items.length ? <Empty icon={<Building2 size={28} />} title="Nothing here" text="No properties match this filter." /> : (
        <div className="space-y-3">
          {data.items.map((p) => (
            <div key={p.id} className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-3 shadow-card sm:flex-row sm:items-center">
              <div className="aspect-[16/9] w-full shrink-0 overflow-hidden rounded-2xl sm:aspect-square sm:w-24"><Img src={p.images[0]} alt="" seed={p.slug} className="size-full" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><Badge tone={propTone[p.status]}>{p.status}</Badge>{p.featured ? <Badge tone="gold"><Star size={11} />Featured</Badge> : null}{p.verified ? <Badge tone="brand"><BadgeCheck size={11} />Verified</Badge> : null}</div>
                <Link to={`/admin/properties/${p.id}`} className="mt-1 block truncate font-extrabold hover:text-brand-700">{p.title}</Link>
                <p className="text-sm text-ink-3">{inr(p.price)}{p.listing_type === "rent" && "/mo"} · {typeLabel(p.property_type)} · {[p.locality_name, p.city_name].filter(Boolean).join(", ")}</p>
                <p className="mt-0.5 text-xs text-ink-3">{p.poster_name ? `By ${p.poster_name} (user)` : p.agent_name ? `Agent: ${p.agent_name}` : ""} · {p.views} views · {p.leads} leads · {timeAgo(p.created_at)}</p>
                {p.status === "rejected" && p.reject_reason && <p className="text-xs font-medium text-danger">Reason: {p.reject_reason}</p>}
              </div>
              <div className="flex flex-wrap gap-2 sm:w-52 sm:justify-end">
                {mgr && p.status === "pending" && <><Button size="sm" onClick={() => act(() => api.post(`/api/admin/properties/${p.id}/status`, { status: "active" }), "Approved & live")}><Check size={15} />Approve</Button><Button size="sm" variant="outline" onClick={() => { setReject(p); setReason(""); }}><X size={15} />Reject</Button></>}
                {mgr && p.status === "active" && <><Button size="sm" variant="outline" onClick={() => act(() => api.post(`/api/admin/properties/${p.id}/status`, { status: "active", featured: !p.featured }), p.featured ? "Unfeatured" : "Featured")}><Star size={14} className={p.featured ? "fill-gold-400 text-gold-400" : ""} /></Button><Button size="sm" variant="outline" onClick={() => act(() => api.post(`/api/admin/properties/${p.id}/status`, { status: "active", verified: !p.verified }), p.verified ? "Verification removed" : "Marked verified")}><BadgeCheck size={14} className={p.verified ? "text-brand-600" : ""} /></Button></>}
                <Link to={`/admin/properties/${p.id}`}><Button size="sm" variant="soft"><Pencil size={14} />Edit</Button></Link>
                {p.status === "active" && <a href={`/property/${p.slug}`} target="_blank" rel="noreferrer"><Button size="sm" variant="ghost"><Eye size={15} /></Button></a>}
                {mgr && <Button size="sm" variant="ghost" className="!text-danger" onClick={() => confirm("Delete this property permanently?") && act(() => api.del(`/api/admin/properties/${p.id}`), "Deleted")}><Trash2 size={15} /></Button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {data && data.total > data.limit && <div className="mt-6 flex items-center justify-center gap-3"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button><span className="text-sm font-semibold">Page {page} of {Math.ceil(data.total / data.limit)}</span><Button variant="outline" size="sm" disabled={page * data.limit >= data.total} onClick={() => setPage(page + 1)}>Next</Button></div>}
      <Sheet open={!!reject} onClose={() => setReject(null)} title="Reject listing">
        <div className="space-y-4 pt-2"><p className="text-sm text-ink-3">Tell the poster what to fix — they'll see this note.</p><textarea className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Photos are blurry; please add clearer pictures." />
          <Button full size="lg" variant="danger" onClick={() => { const id = reject.id; setReject(null); act(() => api.post(`/api/admin/properties/${id}/status`, { status: "rejected", reason }), "Listing rejected"); }}>Reject listing</Button></div>
      </Sheet>
    </div>
  );
}

export function AdminPropertyEdit() {
  const { id } = useParams(); const nav = useNavigate(); const { toast } = useApp(); const { staff } = useStaff();
  const isNew = id === "new";
  const [initial, setInitial] = useState<any>(); const [loading, setLoading] = useState(!isNew);
  const { data: team } = useFetch<{ items: { id: number; name: string; role: string }[] }>(isManager(staff) ? "/api/admin/staff" : null);
  useEffect(() => { if (!isNew) api.get<any>(`/api/admin/properties/${id}`).then((p) => setInitial(fromProperty(p))).catch(() => nav("/admin/properties")).finally(() => setLoading(false)); }, [id, isNew, nav]);
  if (loading) return <Skeleton className="h-96 !rounded-3xl" />;
  return (
    <div>
      <PageTitle title={isNew ? "Add property" : "Edit property"} sub={isManager(staff) ? "Listings you add are published immediately." : "New listings are reviewed by a manager before going live."} />
      <PropertyForm admin={isManager(staff)} agents={team?.items.filter((s) => s.role === "agent")} initial={initial} submitLabel={isNew ? (isManager(staff) ? "Publish listing" : "Submit for review") : "Save changes"}
        onSubmit={async (f) => { isNew ? await api.post("/api/admin/properties", toPayload(f)) : await api.put(`/api/admin/properties/${id}`, toPayload(f)); toast(isNew ? "Property added" : "Saved"); nav("/admin/properties"); }} />
    </div>
  );
}

export function AdminLeads() {
  const { staff } = useStaff(); const { toast } = useApp(); const mgr = isManager(staff);
  const [status, setStatus] = useState(""); const [q, setQ] = useState(""); const dq = useDebounced(q); const [page, setPage] = useState(1); const [open, setOpen] = useState<any>(null); const [notes, setNotes] = useState("");
  const { data, loading, reload } = useFetch<{ items: any[]; total: number; limit: number }>(`/api/admin/leads?page=${page}&status=${status}&q=${encodeURIComponent(dq)}`);
  const { data: team } = useFetch<{ items: any[] }>(mgr ? "/api/admin/staff" : null);
  useEffect(() => setPage(1), [status, dq]);
  const patch = async (id: number, body: object, msg = "Updated") => { try { await api.patch(`/api/admin/leads/${id}`, body); toast(msg); reload(); setOpen((o: any) => (o && o.id === id ? { ...o, ...body } : o)); } catch (e: any) { toast(e.message, "error"); } };
  return (
    <div>
      <PageTitle title="Leads" sub={`${data?.total ?? 0} enquiries`} action={mgr ? <a href="/api/admin/leads.csv"><Button variant="outline"><Download size={16} />Export CSV</Button></a> : undefined} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" /><input className="input !pl-10" placeholder="Search name, phone, email…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">{[{ value: "", label: "All" }, ...LEAD_STATUSES].map((s) => <Chip key={s.value} active={status === s.value} onClick={() => setStatus(s.value)}>{s.label}</Chip>)}</div></div>
      {loading ? <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 !rounded-3xl" />)}</div> : !data?.items.length ? <Empty icon={<Inbox size={28} />} title="No leads" text="New enquiries will appear here instantly." /> : (
        <div className="space-y-3">{data.items.map((l) => (
          <button key={l.id} onClick={() => { setOpen(l); setNotes(l.notes ?? ""); }} className="flex w-full items-center gap-4 rounded-3xl border border-line bg-white p-4 text-left shadow-card transition active:scale-[0.99]">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 font-extrabold text-brand-800">{l.name[0]}</span>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="truncate font-extrabold">{l.name}</span><Badge tone="gray">{l.kind}</Badge></div><div className="truncate text-sm text-ink-3">{l.property_title ?? l.project_name ?? "General enquiry"}</div><div className="text-xs text-ink-3">{l.phone} · {timeAgo(l.created_at)}{l.assigned_name ? ` · ${l.assigned_name}` : ""}</div></div>
            <Badge tone={leadTone[l.status]}>{l.status.replace("_", " ")}</Badge>
          </button>))}</div>)}
      {data && data.total > data.limit && <div className="mt-6 flex items-center justify-center gap-3"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button><span className="text-sm font-semibold">Page {page}</span><Button variant="outline" size="sm" disabled={page * data.limit >= data.total} onClick={() => setPage(page + 1)}>Next</Button></div>}
      <Sheet open={!!open} onClose={() => setOpen(null)} title="Lead details" wide>
        {open && <div className="space-y-5 pt-2">
          <div><div className="text-xl font-extrabold">{open.name}</div><div className="mt-1 flex flex-wrap gap-2"><a href={`tel:${open.phone}`}><Button size="sm"><Phone size={15} />{open.phone}</Button></a><a href={`https://wa.me/${open.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><Button size="sm" variant="outline">WhatsApp</Button></a>{open.email && <a href={`mailto:${open.email}`}><Button size="sm" variant="outline">Email</Button></a>}</div></div>
          <div className="rounded-2xl bg-surface p-4 text-sm"><div><b>Type:</b> {open.kind} · <b>Source:</b> {open.source ?? "web"} · {dateFmt(open.created_at)}</div>{open.property_title && <div className="mt-1"><b>Property:</b> <a className="font-semibold text-brand-700" href={`/property/${open.property_slug}`} target="_blank" rel="noreferrer">{open.property_title}</a></div>}{open.project_name && <div className="mt-1"><b>Project:</b> {open.project_name}</div>}{open.visit_at && <div className="mt-1"><b>Visit:</b> {new Date(open.visit_at).toLocaleString("en-IN")}</div>}{open.message && <p className="mt-2 border-t border-line pt-2 text-ink-2">{open.message}</p>}</div>
          <Field label="Status"><div className="flex flex-wrap gap-2">{LEAD_STATUSES.map((s) => <Chip key={s.value} active={open.status === s.value} onClick={() => patch(open.id, { status: s.value }, "Status updated")}>{s.label}</Chip>)}</div></Field>
          {mgr && <Field label="Assigned to"><select className="input" value={open.assigned_staff_id ?? ""} onChange={(e) => patch(open.id, { assigned_staff_id: e.target.value || null }, "Reassigned")}><option value="">Unassigned</option>{team?.items.filter((s: any) => s.active).map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}</select></Field>}
          <Field label="Internal notes"><textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Call summary, follow-up date…" /></Field>
          <Button full size="lg" onClick={() => patch(open.id, { notes }, "Notes saved")}>Save notes</Button>
        </div>}
      </Sheet>
    </div>
  );
}
export { Chip, Input };
