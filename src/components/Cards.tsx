import { Link } from "react-router";
import { motion } from "motion/react";
import { BadgeCheck, BedDouble, Bath, Heart, MapPin, Maximize2, Sofa, Star, Building2, ArrowUpRight } from "lucide-react";
import { Img } from "./Img";
import { Badge } from "./ui";
import { useApp } from "@/lib/app";
import { bhk, cx, inr, perSqft, priceLabel, timeAgo } from "@/lib/format";
import { typeLabel } from "../../shared/constants";
import type { Project, Property } from "@/lib/types";

export function HeartButton({ id, className }: { id: number; className?: string }) {
  const { favIds, toggleFav } = useApp();
  const on = favIds.has(id);
  return (
    <motion.button whileTap={{ scale: 0.8 }} aria-label={on ? "Remove from shortlist" : "Save to shortlist"} aria-pressed={on}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(id); }}
      className={cx("grid size-10 place-items-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:scale-105", className)}>
      <motion.span key={String(on)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 14 }}>
        <Heart size={19} className={on ? "fill-danger text-danger" : "text-ink-2"} />
      </motion.span>
    </motion.button>
  );
}

const furnLabel: Record<string, string> = { unfurnished: "Unfurnished", semi: "Semi-furnished", full: "Furnished" };

export function PropertyCard({ p, layout = "grid", className }: { p: Property; layout?: "grid" | "list"; className?: string }) {
  const title = [bhk(p), typeLabel(p.property_type).split(" / ")[0]].filter(Boolean).join(" ");
  const loc = [p.locality_name, p.city_name].filter(Boolean).join(", ");
  const sq = perSqft(p);
  return (
    <motion.article whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cx("group relative overflow-hidden rounded-[26px] border border-line bg-white shadow-card transition-shadow hover:shadow-lift", layout === "list" && "sm:flex", className)}>
      <Link to={`/property/${p.slug}`} className={cx("relative block overflow-hidden", layout === "list" ? "aspect-[16/11] sm:aspect-auto sm:w-[44%] sm:shrink-0" : "aspect-[16/11]")}>
        <Img src={p.images[0]} alt={p.title} seed={p.slug} className="size-full transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {p.featured ? <Badge tone="gold"><Star size={11} className="fill-current" /> Featured</Badge> : null}
          {p.verified ? <Badge tone="brand" className="bg-white/95"><BadgeCheck size={12} /> Verified</Badge> : null}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
          <div>
            <div className="text-2xl font-extrabold leading-none drop-shadow">{priceLabel(p)}</div>
            {sq && <div className="mt-1 text-xs font-medium text-white/80">{sq}</div>}
          </div>
          {p.images.length > 1 && <span className="rounded-full bg-black/45 px-2 py-1 text-[11px] font-bold backdrop-blur">1/{p.images.length}</span>}
        </div>
      </Link>
      <HeartButton id={p.id} className="absolute right-3 top-3" />
      <Link to={`/property/${p.slug}`} className="block flex-1 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-[16.5px] font-bold leading-snug">{p.title}</h3>
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-sm text-ink-3"><MapPin size={14} className="shrink-0 text-brand-600" /><span className="truncate">{loc}</span></p>
        <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-semibold text-ink-2">
          {p.bedrooms ? <span className="flex items-center gap-1.5"><BedDouble size={16} className="text-brand-600" />{title.split(" ").slice(0, 2).join(" ")}</span> : <span className="flex items-center gap-1.5"><Building2 size={16} className="text-brand-600" />{typeLabel(p.property_type).split(" / ")[0]}</span>}
          {p.bathrooms ? <span className="flex items-center gap-1.5"><Bath size={16} className="text-brand-600" />{p.bathrooms} Bath</span> : null}
          {p.area_sqft ? <span className="flex items-center gap-1.5"><Maximize2 size={15} className="text-brand-600" />{p.area_sqft.toLocaleString("en-IN")} sq ft</span> : null}
          {p.furnishing ? <span className="flex items-center gap-1.5"><Sofa size={16} className="text-brand-600" />{furnLabel[p.furnishing] ?? p.furnishing}</span> : null}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-dashed border-line pt-3 text-xs text-ink-3">
          <span>{p.owner_type === "owner" ? "Owner" : p.owner_type === "builder" ? "Builder" : "Agent"} · {timeAgo(p.published_at ?? p.created_at)}</span>
          <span className="flex items-center gap-1 font-bold text-brand-700">View details <ArrowUpRight size={14} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
        </div>
      </Link>
    </motion.article>
  );
}

export function ProjectCard({ p, className }: { p: Project; className?: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} className={cx("group", className)}>
      <Link to={`/project/${p.slug}`} className="relative block overflow-hidden rounded-[26px] border border-line bg-white shadow-card hover:shadow-lift">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Img src={p.images?.[0]} alt={p.name} seed={p.slug} className="size-full transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-950/10 to-transparent" />
          <div className="absolute left-3 top-3"><Badge tone="gold">{p.possession ?? "New launch"}</Badge></div>
          <div className="absolute inset-x-4 bottom-4 text-white">
            <h3 className="font-display text-xl font-semibold leading-tight">{p.name}</h3>
            <p className="mt-0.5 text-sm text-white/75">{p.builder}</p>
          </div>
        </div>
        <div className="p-4">
          <p className="flex items-center gap-1 text-sm text-ink-3"><MapPin size={14} className="text-brand-600" />{[p.locality_name, p.city_name].filter(Boolean).join(", ")}</p>
          <div className="mt-3 flex items-end justify-between">
            <div><div className="text-xs font-semibold text-ink-3">Starting</div><div className="text-lg font-extrabold">{inr(p.price_min)}{p.price_max ? <span className="text-sm font-semibold text-ink-3"> – {inr(p.price_max)}</span> : null}</div></div>
            <span className="text-sm font-semibold text-ink-2">{p.configurations}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[26px] border border-line bg-white">
      <div className="skeleton aspect-[16/11] !rounded-none" />
      <div className="space-y-3 p-4"><div className="skeleton h-5 w-4/5" /><div className="skeleton h-4 w-1/2" /><div className="skeleton h-4 w-full" /></div>
    </div>
  );
}
