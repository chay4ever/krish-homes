import { useState } from "react";
import { cx, fallbackFor } from "@/lib/format";

/** Image with graceful fallback (remote images may fail or be blocked). */
export function Img({ src, alt, className, seed = "", eager }: { src?: string | null; alt: string; className?: string; seed?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const url = !src || failed ? fallbackFor(seed || alt) : src;
  return <img src={url} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} className={cx("object-cover", className)} />;
}
