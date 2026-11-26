import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Grid2x2, X } from "lucide-react";
import { Img } from "./Img";
import { cx } from "@/lib/format";

export function Gallery({ images, alt, seed, overlay }: { images: string[]; alt: string; seed: string; overlay?: React.ReactNode }) {
  const imgs = images.length ? images : [""];
  const [idx, setIdx] = useState(0);
  const [lb, setLb] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const onScroll = () => { const el = ref.current; if (el) setIdx(Math.round(el.scrollLeft / el.clientWidth)); };
  useEffect(() => {
    if (lb === null) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setLb(null); if (e.key === "ArrowRight") setLb((i) => (i! + 1) % imgs.length); if (e.key === "ArrowLeft") setLb((i) => (i! - 1 + imgs.length) % imgs.length); };
    window.addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [lb, imgs.length]);

  return (
    <>
      {/* Mobile: swipeable pager */}
      <div className="relative lg:hidden">
        <div ref={ref} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
          {imgs.map((src, i) => <button key={i} onClick={() => setLb(i)} className="aspect-[4/3] w-full shrink-0 snap-center" aria-label={`Open photo ${i + 1}`}><Img src={src} alt={`${alt} photo ${i + 1}`} seed={seed + i} className="size-full" eager={i === 0} /></button>)}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent" />
        {overlay}
        <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {imgs.slice(0, 8).map((_, i) => <span key={i} className={cx("h-1.5 rounded-full bg-white transition-all", i === idx ? "w-5" : "w-1.5 opacity-60")} />)}
        </div>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">{idx + 1}/{imgs.length}</span>
      </div>

      {/* Desktop: mosaic */}
      <div className="relative hidden h-[460px] grid-cols-4 grid-rows-2 gap-2.5 overflow-hidden rounded-[28px] lg:grid">
        {[0, 1, 2, 3, 4].map((i) => {
          const src = imgs[i % imgs.length];
          return (
            <button key={i} onClick={() => setLb(Math.min(i, imgs.length - 1))} className={cx("group relative overflow-hidden", i === 0 ? "col-span-2 row-span-2" : "")} aria-label={`Open photo ${i + 1}`}>
              <Img src={src} alt={`${alt} photo ${i + 1}`} seed={seed + i} className="size-full transition duration-700 group-hover:scale-105" eager={i === 0} />
            </button>
          );
        })}
        <button onClick={() => setLb(0)} className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold shadow-lift"><Grid2x2 size={16} />View all {imgs.length} photos</button>
      </div>

      <AnimatePresence>
        {lb !== null && (
          <motion.div className="fixed inset-0 z-[120] flex flex-col bg-black/95" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between p-4 pt-[calc(1rem+var(--safe-t))] text-white"><span className="text-sm font-bold">{lb + 1} / {imgs.length}</span><button onClick={() => setLb(null)} className="grid size-10 place-items-center rounded-full bg-white/10" aria-label="Close"><X /></button></div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div key={lb} className="flex size-full items-center justify-center px-2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.4}
                  onDragEnd={(_, i) => { if (i.offset.x < -80) setLb((lb + 1) % imgs.length); else if (i.offset.x > 80) setLb((lb - 1 + imgs.length) % imgs.length); }}>
                  <Img src={imgs[lb]} alt={alt} seed={seed + lb} className="max-h-full max-w-full rounded-xl object-contain" eager />
                </motion.div>
              </AnimatePresence>
              {imgs.length > 1 && <>
                <button onClick={() => setLb((lb - 1 + imgs.length) % imgs.length)} className="absolute left-4 hidden size-12 place-items-center rounded-full bg-white/15 text-white md:grid" aria-label="Previous"><ChevronLeft /></button>
                <button onClick={() => setLb((lb + 1) % imgs.length)} className="absolute right-4 hidden size-12 place-items-center rounded-full bg-white/15 text-white md:grid" aria-label="Next"><ChevronRight /></button>
              </>}
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto p-3 pb-[calc(0.75rem+var(--safe-b))]">
              {imgs.map((s, i) => <button key={i} onClick={() => setLb(i)} className={cx("h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2", i === lb ? "border-gold-400" : "border-transparent opacity-60")}><Img src={s} alt="" seed={seed + i} className="size-full" /></button>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
