import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { BadgeCheck, BedDouble, Bath, Calendar, Car, ChevronLeft, Compass, Eye, Layers, MapPin, Maximize2, MessageCircle, Phone, Share2, ShieldCheck, Sofa, Check, Building2, Navigation, Hourglass, Wallet } from "lucide-react";
import { Gallery } from "@/components/Gallery";
import { HeartButton, PropertyCard } from "@/components/Cards";
import { EmiCalculator } from "@/components/Emi";
import { EnquiryForm, EnquirySheet } from "@/components/EnquiryForm";
import { Badge, Button, Empty, Skeleton } from "@/components/ui";
import { useApp } from "@/lib/app";
import { api } from "@/lib/api";
import { useFetch, useTitle } from "@/lib/hooks";
import { bhk, cx, inr, perSqft, timeAgo } from "@/lib/format";
import { typeLabel } from "../../shared/constants";
import type { Property } from "@/lib/types";

const furn: Record<string, string> = { unfurnished: "Unfurnished", semi: "Semi-furnished", full: "Fully furnished" };

export default function PropertyDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { brand, requireAuth, toast } = useApp();
  const { data: p, loading, error } = useFetch<Property>(`/api/properties/${slug}`);
  const [sheet, setSheet] = useState<null | "enquiry" | "visit" | "callback">(null);
  const [contact, setContact] = useState<{ name: string | null; phone: string | null } | null>(null);
  useTitle(p ? `${p.title}` : "Property", brand.name);

  const share = async () => {
    const url = location.href;
    try { if (navigator.share) await navigator.share({ title: p?.title, url }); else { await navigator.clipboard.writeText(url); toast("Link copied"); } } catch { /* cancelled */ }
  };
  const reveal = () => requireAuth("Sign in to view contact details", async () => {
    try { setContact(await api.post(`/api/u/contact/${slug}`)); } catch (e: any) { toast(e.message, "error"); }
  });

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6"><Skeleton className="aspect-[4/3] w-full !rounded-3xl lg:h-[460px] lg:aspect-auto" /><Skeleton className="mt-6 h-10 w-2/3" /><Skeleton className="mt-3 h-6 w-1/3" /></div>;
  if (error || !p) return <Empty icon={<Building2 size={30} />} title="Listing not available" text={error ?? "This property may have been removed or already sold."} action={<Link to="/search"><Button>Browse properties</Button></Link>} />;

  const loc = p.address && p.address.toLowerCase().includes(p.city_name.toLowerCase()) ? p.address : [p.address ?? p.locality_name, p.city_name].filter(Boolean).join(", ");
  const sq = perSqft(p);
  const facts: [string, string | number | null | undefined, typeof Layers][] = [
    ["Bedrooms", p.bedrooms ? `${p.bedrooms} BHK` : null, BedDouble], ["Bathrooms", p.bathrooms, Bath], ["Built-up area", p.area_sqft ? `${p.area_sqft.toLocaleString("en-IN")} sq ft` : null, Maximize2],
    ["Plot area", p.plot_area ? `${p.plot_area.toLocaleString("en-IN")} sq ft` : null, Maximize2], ["Floor", p.floor !== null && p.floor !== undefined ? `${p.floor === 0 ? "Ground" : p.floor}${p.total_floors ? ` of ${p.total_floors}` : ""}` : null, Layers],
    ["Facing", p.facing, Compass], ["Furnishing", p.furnishing ? furn[p.furnishing] : null, Sofa], ["Property age", p.age_years !== null && p.age_years !== undefined ? (p.age_years === 0 ? "New" : `${p.age_years} yrs`) : null, Hourglass],
    ["Possession", p.possession === "under_construction" ? "Under construction" : "Ready to move", Calendar], ["Parking", p.parking ? `${p.parking} covered` : null, Car],
    [p.listing_type === "rent" ? "Security deposit" : "Maintenance", p.listing_type === "rent" ? (p.deposit ? inr(p.deposit) : null) : (p.maintenance ? `${inr(p.maintenance)}/mo` : null), Wallet],
    ["RERA ID", p.rera_id, ShieldCheck],
  ];

  const overlay = (
    <>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[calc(0.75rem+var(--safe-t))]">
        <button onClick={() => (history.length > 1 ? nav(-1) : nav("/search"))} aria-label="Back" className="grid size-10 place-items-center rounded-full bg-white/90 shadow-md backdrop-blur active:scale-90"><ChevronLeft size={22} /></button>
        <div className="flex gap-2"><button onClick={share} aria-label="Share" className="grid size-10 place-items-center rounded-full bg-white/90 shadow-md backdrop-blur active:scale-90"><Share2 size={18} /></button><HeartButton id={p.id} /></div>
      </div>
    </>
  );

  const ContactCard = (
    <div className="rounded-[28px] border border-line bg-white p-5 shadow-card">
      <div className="flex items-center gap-3">
        {p.agent_photo ? <img src={p.agent_photo} alt="" className="size-12 rounded-full object-cover" /> : <span className="grid size-12 place-items-center rounded-full bg-brand-100 text-lg font-extrabold text-brand-800">{(p.agent_name ?? p.contact_name ?? "A")[0]}</span>}
        <div className="min-w-0"><div className="truncate font-extrabold">{p.agent_name ?? p.contact_name ?? "Property advisor"}</div><div className="text-xs font-medium text-ink-3">{p.owner_type === "owner" ? "Owner" : p.owner_type === "builder" ? "Builder" : "Agent"}{p.agent_agency ? ` · ${p.agent_agency}` : ""}</div></div>
        {p.verified ? <Badge tone="brand" className="ml-auto shrink-0"><BadgeCheck size={12} />Verified</Badge> : null}
      </div>
      <div className="mt-4 space-y-2.5">
        {contact ? (
          <div className="rounded-2xl bg-brand-50 p-4 text-center">
            <div className="text-xs font-semibold text-brand-800">{contact.name}</div>
            <a href={`tel:${contact.phone}`} className="text-xl font-extrabold text-brand-800">{contact.phone}</a>
            <div className="mt-3 grid grid-cols-2 gap-2"><a href={`tel:${contact.phone}`}><Button full size="sm"><Phone size={15} />Call</Button></a><a href={`https://wa.me/${(contact.phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in "${p.title}" on ${brand.name}`)}`} target="_blank" rel="noreferrer"><Button full size="sm" variant="outline"><MessageCircle size={15} />WhatsApp</Button></a></div>
          </div>
        ) : <Button full size="lg" onClick={reveal}><Phone size={18} />View phone number</Button>}
      </div>
      <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-ink-3"><span className="h-px flex-1 bg-line" />or send a message<span className="h-px flex-1 bg-line" /></div>
      <EnquiryForm propertySlug={p.slug} title={p.title} />
    </div>
  );

  return (
    <div className="pb-28 lg:pb-12">
      <div className="mx-auto max-w-7xl lg:px-6 lg:pt-6">
        <nav className="mb-4 hidden items-center gap-2 text-sm text-ink-3 lg:flex"><Link to="/" className="hover:text-brand-700">Home</Link>/<Link to={`/search?type=${p.listing_type}`} className="hover:text-brand-700">{p.listing_type === "rent" ? "Rent" : "Buy"}</Link>/<Link to={`/search?city=${p.city_slug}`} className="hover:text-brand-700">{p.city_name}</Link>/<span className="truncate text-ink-2">{p.title}</span></nav>
        <Gallery images={p.images} alt={p.title} seed={p.slug} overlay={overlay} />
      </div>

      <div className="mx-auto mt-5 grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_400px]">
        <div className="min-w-0 space-y-8">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              {p.featured ? <Badge tone="gold">Featured</Badge> : null}{p.verified ? <Badge tone="brand"><BadgeCheck size={12} />Verified</Badge> : null}
              <Badge tone="gray">{p.listing_type === "rent" ? "For rent" : "For sale"}</Badge>{p.possession === "under_construction" && <Badge tone="gray">Under construction</Badge>}
            </div>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-[1.45rem] font-extrabold leading-tight sm:text-3xl">{p.title}</h1>
                <p className="mt-2 flex items-start gap-1.5 text-[15px] text-ink-3"><MapPin size={17} className="mt-0.5 shrink-0 text-brand-600" />{loc}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-brand-800 sm:text-4xl">{inr(p.price)}{p.listing_type === "rent" && <span className="text-base font-semibold text-ink-3">/mo</span>}</div>
                {sq && <div className="text-sm font-semibold text-ink-3">{sq}</div>}
                {p.negotiable ? <div className="mt-1 text-xs font-bold text-gold-600">Price negotiable</div> : null}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs font-medium text-ink-3"><span className="flex items-center gap-1"><Eye size={14} />{p.views.toLocaleString("en-IN")} views</span><span>Posted {timeAgo(p.published_at ?? p.created_at)}</span><span>ID #{p.id}</span></div>
          </header>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            {[[bhk(p) || typeLabel(p.property_type).split(" / ")[0], typeLabel(p.property_type).split(" / ")[0], BedDouble], [p.area_sqft?.toLocaleString("en-IN") + " sq ft", "Area", Maximize2], [p.furnishing ? furn[p.furnishing] : p.possession === "ready" ? "Ready" : "Upcoming", p.furnishing ? "Furnishing" : "Possession", Sofa]].map(([a, b, I]: any) => (
              <div key={b} className="rounded-3xl border border-line bg-white p-3.5 text-center shadow-card sm:p-5"><I size={22} className="mx-auto text-brand-600" /><div className="mt-2 text-sm font-extrabold sm:text-base">{a}</div><div className="text-[11px] font-semibold text-ink-3 sm:text-xs">{b}</div></div>
            ))}
          </div>

          {p.description && <section><h2 className="mb-3 text-xl font-extrabold">About this property</h2><div className="prose-lite whitespace-pre-line text-[15.5px]">{p.description}</div></section>}

          <section>
            <h2 className="mb-4 text-xl font-extrabold">Property details</h2>
            <dl className="grid grid-cols-2 gap-x-6 overflow-hidden rounded-3xl border border-line bg-white p-2 shadow-card sm:grid-cols-3">
              {facts.filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v, I]) => (
                <div key={k} className="flex items-center gap-3 border-b border-line/60 p-3 last:border-0 sm:[&:nth-last-child(-n+3)]:border-0"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><I size={18} /></span><div className="min-w-0"><dt className="text-xs font-semibold text-ink-3">{k}</dt><dd className="truncate text-sm font-extrabold">{v}</dd></div></div>
              ))}
            </dl>
          </section>

          {!!p.amenities?.length && (
            <section><h2 className="mb-4 text-xl font-extrabold">Amenities</h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">{p.amenities.map((a) => <li key={a} className="flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-3 text-sm font-semibold shadow-card"><Check size={16} className="shrink-0 text-brand-600" />{a}</li>)}</ul>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-xl font-extrabold">Location</h2>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-white p-5 shadow-card">
              <div className="flex items-start gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700"><MapPin /></span><div><div className="font-extrabold">{p.locality_name ?? p.city_name}</div><div className="text-sm text-ink-3">{loc}</div></div></div>
              <a target="_blank" rel="noreferrer" href={p.lat && p.lng ? `https://www.google.com/maps?q=${p.lat},${p.lng}` : `https://www.google.com/maps/search/${encodeURIComponent(loc)}`}><Button variant="outline"><Navigation size={16} />Open in Maps</Button></a>
            </div>
          </section>

          {p.listing_type === "sale" && (
            <section><h2 className="mb-4 text-xl font-extrabold">Estimate your EMI</h2><div className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7"><EmiCalculator price={p.price} compact /></div></section>
          )}

          {!!p.similar?.length && (
            <section>
              <h2 className="mb-4 text-xl font-extrabold">Similar properties</h2>
              <div className="snap-row no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">{p.similar.map((s) => <div key={s.id} className="w-[82%] sm:w-[330px]"><PropertyCard p={s} /></div>)}</div>
            </section>
          )}
        </div>

        <aside className="hidden lg:block"><div className="sticky top-24 space-y-4">{ContactCard}{p.owner_type === "owner" && <p className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-50 to-cyan-50 p-3.5 text-sm font-bold text-sky-800"><BadgeCheck size={18} className="shrink-0" />Posted by the owner — zero brokerage. Call directly and negotiate freely.</p>}<p className={cx("flex items-center gap-2 rounded-2xl bg-brand-50 p-3.5 text-xs font-semibold text-brand-800")}><ShieldCheck size={18} className="shrink-0" />Never pay advance money before visiting. Report suspicious listings to {brand.email}.</p></div></aside>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/95 px-4 pb-[calc(0.75rem+var(--safe-b))] pt-3 shadow-nav backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-2.5">
          <div className="min-w-0 pr-1"><div className="text-lg font-extrabold leading-none">{inr(p.price)}</div><div className="text-[11px] font-semibold text-ink-3">{p.listing_type === "rent" ? "per month" : sq ?? "total price"}</div></div>
          <Button variant="outline" className="ml-auto !px-4" onClick={() => setSheet("visit")}><Calendar size={17} />Visit</Button>
          <Button className="flex-1" onClick={() => setSheet("enquiry")}><MessageCircle size={17} />Contact</Button>
        </div>
      </div>
      <EnquirySheet open={sheet !== null} onClose={() => setSheet(null)} propertySlug={p.slug} title={p.title} initialKind={sheet ?? "enquiry"} />
    </div>
  );
}
