import { useEffect, useState } from "react";
import { FolderKanban, FileText, Pencil, Plus, Search, Trash2, UserCog, Users, ShieldCheck, Ban, KeyRound, History } from "lucide-react";
import { PageTitle, isManager, useStaff } from "./Admin";
import { Badge, Button, Chip, Empty, Field, Input, Sheet, Skeleton } from "@/components/ui";
import { ImageUploader } from "@/components/ImageUploader";
import { Img } from "@/components/Img";
import { api } from "@/lib/api";
import { useApp } from "@/lib/app";
import { useDebounced, useFetch } from "@/lib/hooks";
import { dateFmt, inr, timeAgo } from "@/lib/format";
import { AMENITIES, ROLE_LABEL } from "../../shared/constants";

const num = (v: string) => v.replace(/\D/g, "");

export function AdminProjects() {
  const { cities, localities, toast } = useApp();
  const { data, loading, reload } = useFetch<{ items: any[] }>("/api/admin/projects");
  const [f, setF] = useState<any>(null);
  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));
  const save = async () => { try { f.id ? await api.put(`/api/admin/projects/${f.id}`, f) : await api.post("/api/admin/projects", f); toast("Project saved"); setF(null); reload(); } catch (e: any) { toast(e.message, "error"); } };
  const blank = { name: "", builder: "", city_id: "", locality_id: "", price_min: "", price_max: "", area_min: "", area_max: "", configurations: "", possession: "", total_units: "", rera_id: "", description: "", amenities: [], images: [], featured: 0, status: "active" };
  return (
    <div>
      <PageTitle title="Projects" sub="New launches and developments" action={<Button onClick={() => setF(blank)}><Plus size={18} />Add project</Button>} />
      {loading ? <Skeleton className="h-40 !rounded-3xl" /> : !data?.items.length ? <Empty icon={<FolderKanban size={28} />} title="No projects" /> : (
        <div className="grid gap-3 sm:grid-cols-2">{data.items.map((p) => (
          <div key={p.id} className="flex gap-3 rounded-3xl border border-line bg-white p-3 shadow-card"><div className="size-24 shrink-0 overflow-hidden rounded-2xl"><Img src={p.images[0]} alt="" seed={p.slug} className="size-full" /></div>
            <div className="min-w-0 flex-1"><div className="flex gap-1.5">{p.featured ? <Badge tone="gold">Featured</Badge> : null}<Badge tone={p.status === "active" ? "green" : "gray"}>{p.status}</Badge></div><div className="mt-1 truncate font-extrabold">{p.name}</div><div className="truncate text-sm text-ink-3">{p.builder} · {p.city_name}</div><div className="text-sm font-bold">{inr(p.price_min)} – {inr(p.price_max)}</div>
              <div className="mt-2 flex gap-2"><Button size="sm" variant="soft" onClick={() => setF({ ...p, city_id: p.city_id ?? "", locality_id: p.locality_id ?? "", price_min: p.price_min ?? "", price_max: p.price_max ?? "", area_min: p.area_min ?? "", area_max: p.area_max ?? "", total_units: p.total_units ?? "" })}><Pencil size={14} />Edit</Button><Button size="sm" variant="ghost" className="!text-danger" onClick={async () => { if (confirm("Delete this project?")) { await api.del(`/api/admin/projects/${p.id}`); reload(); } }}><Trash2 size={14} /></Button></div></div></div>))}</div>)}
      <Sheet open={!!f} onClose={() => setF(null)} title={f?.id ? "Edit project" : "New project"} wide footer={<Button full size="lg" onClick={save}>Save project</Button>}>
        {f && <div className="space-y-4 pt-2">
          <Field label="Project name"><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Builder"><Input value={f.builder ?? ""} onChange={(e) => set("builder", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="City"><select className="input" value={f.city_id} onChange={(e) => setF({ ...f, city_id: e.target.value, locality_id: "" })}><option value="">Select</option>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Locality"><select className="input" value={f.locality_id} onChange={(e) => set("locality_id", e.target.value)}><option value="">Select</option>{localities.filter((l) => String(l.city_id) === String(f.city_id)).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Min price (₹)"><Input inputMode="numeric" value={f.price_min} onChange={(e) => set("price_min", num(e.target.value))} /></Field><Field label="Max price (₹)"><Input inputMode="numeric" value={f.price_max} onChange={(e) => set("price_max", num(e.target.value))} /></Field>
            <Field label="Min area (sq ft)"><Input inputMode="numeric" value={f.area_min} onChange={(e) => set("area_min", num(e.target.value))} /></Field><Field label="Max area (sq ft)"><Input inputMode="numeric" value={f.area_max} onChange={(e) => set("area_max", num(e.target.value))} /></Field></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Configurations"><Input value={f.configurations ?? ""} onChange={(e) => set("configurations", e.target.value)} placeholder="2, 3 BHK" /></Field><Field label="Possession"><Input value={f.possession ?? ""} onChange={(e) => set("possession", e.target.value)} placeholder="Dec 2027" /></Field>
            <Field label="Total units"><Input inputMode="numeric" value={f.total_units} onChange={(e) => set("total_units", num(e.target.value))} /></Field><Field label="RERA ID"><Input value={f.rera_id ?? ""} onChange={(e) => set("rera_id", e.target.value)} /></Field></div>
          <Field label="Description"><textarea className="input" value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
          <Field label="Amenities"><div className="flex flex-wrap gap-2">{AMENITIES.map((a) => <Chip key={a} active={f.amenities?.includes(a)} onClick={() => set("amenities", f.amenities?.includes(a) ? f.amenities.filter((x: string) => x !== a) : [...(f.amenities ?? []), a])}>{a}</Chip>)}</div></Field>
          <Field label="Photos"><ImageUploader value={f.images ?? []} onChange={(v) => set("images", v)} /></Field>
          <div className="flex gap-2"><Chip active={!!f.featured} onClick={() => set("featured", f.featured ? 0 : 1)}>⭐ Featured</Chip><Chip active={f.status === "active"} onClick={() => set("status", f.status === "active" ? "inactive" : "active")}>{f.status === "active" ? "Active" : "Inactive"}</Chip></div>
        </div>}
      </Sheet>
    </div>
  );
}

export function AdminPosts() {
  const { toast } = useApp();
  const { data, loading, reload } = useFetch<{ items: any[] }>("/api/admin/posts");
  const [f, setF] = useState<any>(null);
  const save = async () => { try { f.id ? await api.put(`/api/admin/posts/${f.id}`, f) : await api.post("/api/admin/posts", f); toast("Post saved"); setF(null); reload(); } catch (e: any) { toast(e.message, "error"); } };
  return (
    <div>
      <PageTitle title="Blog posts" sub="Guides and market insights" action={<Button onClick={() => setF({ title: "", excerpt: "", content: "", cover: "", author: "", published: true })}><Plus size={18} />New post</Button>} />
      {loading ? <Skeleton className="h-40 !rounded-3xl" /> : !data?.items.length ? <Empty icon={<FileText size={28} />} title="No posts yet" /> : <div className="space-y-3">{data.items.map((p) => (
        <div key={p.id} className="flex items-center gap-3 rounded-3xl border border-line bg-white p-3 shadow-card"><div className="size-16 shrink-0 overflow-hidden rounded-2xl"><Img src={p.cover} alt="" seed={p.slug} className="size-full" /></div><div className="min-w-0 flex-1"><div className="truncate font-extrabold">{p.title}</div><div className="text-xs text-ink-3">{dateFmt(p.created_at)} · {p.published ? "Published" : "Draft"}</div></div>
          <Button size="sm" variant="soft" onClick={() => setF({ ...p, published: !!p.published })}><Pencil size={14} /></Button><Button size="sm" variant="ghost" className="!text-danger" onClick={async () => { if (confirm("Delete post?")) { await api.del(`/api/admin/posts/${p.id}`); reload(); } }}><Trash2 size={14} /></Button></div>))}</div>}
      <Sheet open={!!f} onClose={() => setF(null)} title={f?.id ? "Edit post" : "New post"} wide footer={<Button full size="lg" onClick={save}>Save post</Button>}>
        {f && <div className="space-y-4 pt-2"><Field label="Title"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field><Field label="Excerpt"><Input value={f.excerpt ?? ""} onChange={(e) => setF({ ...f, excerpt: e.target.value })} /></Field><Field label="Cover image"><ImageUploader single value={f.cover ? [f.cover] : []} onChange={(v) => setF({ ...f, cover: v[0] ?? "" })} /></Field><Field label="Content"><textarea className="input min-h-56" value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} /></Field><Chip active={f.published} onClick={() => setF({ ...f, published: !f.published })}>{f.published ? "Published" : "Draft"}</Chip></div>}
      </Sheet>
    </div>
  );
}

export function AdminUsers() {
  const [q, setQ] = useState(""); const dq = useDebounced(q); const { toast } = useApp();
  const { data, loading, reload } = useFetch<{ items: any[] }>(`/api/admin/users?q=${encodeURIComponent(dq)}`);
  return (
    <div>
      <PageTitle title="Users" sub="People who signed in with Firebase" />
      <div className="relative mb-4"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" /><input className="input !pl-10" placeholder="Search name, email, phone…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {loading ? <Skeleton className="h-40 !rounded-3xl" /> : !data?.items.length ? <Empty icon={<Users size={28} />} title="No users yet" text="Users appear here after they sign in on the website." /> : <div className="space-y-3">{data.items.map((u) => (
        <div key={u.id} className="flex items-center gap-3 rounded-3xl border border-line bg-white p-4 shadow-card"><span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-100 font-extrabold text-brand-800">{u.photo ? <img src={u.photo} alt="" referrerPolicy="no-referrer" className="size-full object-cover" /> : (u.name ?? "?")[0]}</span>
          <div className="min-w-0 flex-1"><div className="flex items-center gap-2 truncate font-extrabold">{u.name ?? "—"}{u.blocked ? <Badge tone="red">Blocked</Badge> : null}</div><div className="truncate text-sm text-ink-3">{u.email ?? u.phone}</div><div className="text-xs text-ink-3">{u.listings} listings · {u.enquiries} enquiries · joined {dateFmt(u.created_at)}</div></div>
          <Button size="sm" variant={u.blocked ? "soft" : "ghost"} onClick={async () => { await api.post(`/api/admin/users/${u.id}/block`, { blocked: !u.blocked }); toast(u.blocked ? "User unblocked" : "User blocked"); reload(); }}><Ban size={15} />{u.blocked ? "Unblock" : "Block"}</Button></div>))}</div>}
    </div>
  );
}

export function AdminStaff() {
  const { staff } = useStaff(); const { toast } = useApp(); const sup = staff?.role === "super_admin"; const mgr = isManager(staff);
  const { data, loading, reload } = useFetch<{ items: any[] }>("/api/admin/staff");
  const [f, setF] = useState<any>(null); const [temp, setTemp] = useState<string | null>(null);
  const save = async () => {
    try {
      if (f.id) await api.put(`/api/admin/staff/${f.id}`, f);
      else { const r = await api.post<{ temporaryPassword?: string }>("/api/admin/staff", f); if (r.temporaryPassword) setTemp(r.temporaryPassword); }
      toast("Saved"); setF(null); reload();
    } catch (e: any) { toast(e.message, "error"); }
  };
  const canEdit = (s: any) => mgr && s.role !== "super_admin" && (sup || s.role === "agent");
  return (
    <div>
      <PageTitle title={mgr ? "Team" : "Agents"} sub="Admin managers and agents" action={mgr ? <Button onClick={() => setF({ role: "agent", name: "", email: "", phone: "", password: "", agency: "", rera_id: "", bio: "" })}><Plus size={18} />Add member</Button> : undefined} />
      {loading ? <Skeleton className="h-40 !rounded-3xl" /> : <div className="grid gap-3 sm:grid-cols-2">{data?.items.map((s) => (
        <div key={s.id} className="rounded-3xl border border-line bg-white p-4 shadow-card"><div className="flex items-center gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-800 font-extrabold text-white">{s.name[0]}</span>
          <div className="min-w-0 flex-1"><div className="truncate font-extrabold">{s.name}</div><div className="truncate text-sm text-ink-3">{mgr ? s.email : s.agency}</div></div><Badge tone={s.role === "super_admin" ? "ink" : s.role === "admin" ? "gold" : "brand"}>{ROLE_LABEL[s.role as keyof typeof ROLE_LABEL]}</Badge></div>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold text-ink-3"><span>{s.listings} listings · {s.leads} leads</span>{!s.active && <Badge tone="red">Inactive</Badge>}</div>
          {canEdit(s) && <div className="mt-3 flex gap-2"><Button size="sm" variant="soft" onClick={() => setF({ ...s, password: "" })}><Pencil size={14} />Edit</Button></div>}</div>))}</div>}
      <Sheet open={!!f} onClose={() => setF(null)} title={f?.id ? "Edit member" : "Add team member"} footer={<Button full size="lg" onClick={save}>Save</Button>}>
        {f && <div className="space-y-4 pt-2">
          {!f.id && <Field label="Role"><div className="flex gap-2"><Chip active={f.role === "agent"} onClick={() => setF({ ...f, role: "agent" })}>Agent</Chip>{sup && <Chip active={f.role === "admin"} onClick={() => setF({ ...f, role: "admin" })}>Admin manager</Chip>}</div></Field>}
          <Field label="Full name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          {!f.id && <Field label="Email (login)"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>}
          <Field label="Phone"><Input value={f.phone ?? ""} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Agency / office"><Input value={f.agency ?? ""} onChange={(e) => setF({ ...f, agency: e.target.value })} /></Field>
          <Field label="RERA ID"><Input value={f.rera_id ?? ""} onChange={(e) => setF({ ...f, rera_id: e.target.value })} /></Field>
          <Field label="Short bio"><textarea className="input" value={f.bio ?? ""} onChange={(e) => setF({ ...f, bio: e.target.value })} /></Field>
          <Field label={f.id ? "Reset password (optional)" : "Initial password"} hint={f.id ? "They'll be asked to change it at next login" : "Leave blank to auto-generate a temporary password"}><Input type="text" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="off" /></Field>
          {f.id && <Chip active={!!f.active} onClick={() => setF({ ...f, active: f.active ? 0 : 1 })}>{f.active ? "Active — can sign in" : "Deactivated"}</Chip>}
        </div>}
      </Sheet>
      <Sheet open={!!temp} onClose={() => setTemp(null)} title="Temporary password">
        <div className="space-y-3 pt-2 text-center"><KeyRound className="mx-auto text-brand-600" size={40} /><p className="text-sm text-ink-3">Share this securely. It's shown only once and must be changed at first login.</p><div className="select-all rounded-2xl bg-surface p-4 font-mono text-xl font-extrabold">{temp}</div><Button full onClick={() => { navigator.clipboard?.writeText(temp ?? ""); toast("Copied"); }}>Copy</Button></div>
      </Sheet>
    </div>
  );
}

export function AdminSettings() {
  const { brand, toast } = useApp();
  const [f, setF] = useState<any>(brand);
  const [fb, setFb] = useState<any>({ apiKey: "", authDomain: "", projectId: "", appId: "" });
  const { data: fbData } = useFetch<{ config: any; fromEnv: boolean }>("/api/admin/settings/firebase");
  useEffect(() => { if (fbData) setFb({ apiKey: "", authDomain: "", projectId: "", appId: "", ...fbData.config }); }, [fbData]);
  const { data: audit } = useFetch<{ items: any[] }>("/api/admin/audit");
  useEffect(() => setF(brand), [brand]);
  const F = (k: string, label: string, area?: boolean) => <Field label={label}>{area ? <textarea className="input" value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} /> : <Input value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} />}</Field>;
  return (
    <div>
      <PageTitle title="Settings" sub="Brand name and contact details — change anytime, no redeploy needed" />
      <div className="grid gap-6 lg:grid-cols-2">
        <form className="space-y-4 rounded-3xl border border-line bg-white p-5 shadow-card" onSubmit={async (e) => { e.preventDefault(); try { await api.put("/api/admin/settings/brand", f); toast("Saved — refresh the site to see changes"); } catch (x: any) { toast(x.message, "error"); } }}>
          <h3 className="flex items-center gap-2 font-extrabold"><ShieldCheck size={18} className="text-brand-600" />Brand & contact</h3>
          {F("name", "Brand name")}{F("tagline", "Tagline")}{F("heroTitle", "Homepage headline")}{F("heroSubtitle", "Homepage sub-headline", true)}{F("phone", "Phone")}{F("whatsapp", "WhatsApp number (digits only)")}{F("email", "Email")}{F("address", "Address")}
          <Button type="submit" size="lg" full>Save settings</Button>
        </form>
        <form className="space-y-4 rounded-3xl border border-line bg-white p-5 shadow-card lg:col-span-2" onSubmit={async (e) => { e.preventDefault(); try { const r = await api.put<{ enabled: boolean }>("/api/admin/settings/firebase", fb); toast(r.enabled ? "Firebase enabled — reload the site to use it" : "Firebase disabled — using built-in sign-in"); } catch (x: any) { toast(x.message, "error"); } }}>
          <h3 className="flex items-center gap-2 font-extrabold"><KeyRound size={18} className="text-brand-600" />Firebase sign-in (optional)</h3>
          <p className="text-sm text-ink-3">Until Firebase is set up, visitors sign in with the built-in email + password. Paste your Firebase <b>web app</b> config (Project settings → General → Your apps) to switch on Google and phone-OTP sign-in. Also enable those providers and add this site's domain under Authentication → Settings → Authorized domains. Clear both fields and save to switch back. {fbData?.fromEnv && <span className="font-semibold text-brand-800">Currently also configured via Worker variables.</span>}</p>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="API key"><Input value={fb.apiKey ?? ""} onChange={(e) => setFb({ ...fb, apiKey: e.target.value })} placeholder="AIza…" autoComplete="off" /></Field><Field label="Project ID"><Input value={fb.projectId ?? ""} onChange={(e) => setFb({ ...fb, projectId: e.target.value })} placeholder="my-project" /></Field><Field label="Auth domain (optional)"><Input value={fb.authDomain ?? ""} onChange={(e) => setFb({ ...fb, authDomain: e.target.value })} placeholder="my-project.firebaseapp.com" /></Field><Field label="App ID (optional)"><Input value={fb.appId ?? ""} onChange={(e) => setFb({ ...fb, appId: e.target.value })} /></Field></div>
          <Button type="submit" size="lg">Save Firebase settings</Button>
        </form>
        <div className="rounded-3xl border border-line bg-white p-5 shadow-card lg:col-span-2"><h3 className="mb-3 flex items-center gap-2 font-extrabold"><History size={18} className="text-brand-600" />Audit log</h3>
          <ul className="max-h-[520px] space-y-2 overflow-y-auto text-sm">{audit?.items.map((a) => <li key={a.id} className="flex justify-between gap-3 border-b border-line/60 pb-2"><span><b>{a.staff ?? "System"}</b> · {a.action}{a.detail ? ` · ${a.detail}` : ""}</span><span className="shrink-0 text-xs text-ink-3">{timeAgo(a.created_at)}</span></li>)}{!audit?.items.length && <li className="text-ink-3">No activity yet.</li>}</ul></div>
      </div>
    </div>
  );
}
export { UserCog };
