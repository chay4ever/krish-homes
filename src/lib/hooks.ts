import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";

export function useFetch<T>(url: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [tick, setTick] = useState(0);
  const reqId = useRef(0);
  useEffect(() => {
    if (!url) { setLoading(false); return; }
    const id = ++reqId.current;
    setLoading(true); setError(null);
    api.get<T>(url).then((d) => { if (id === reqId.current) { setData(d); setLoading(false); } })
      .catch((e) => { if (id === reqId.current) { setError(e.message); setLoading(false); } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, tick, ...deps]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload, setData };
}

export function useTitle(title?: string, brand = "Krish Homes") {
  useEffect(() => { document.title = title ? `${title} · ${brand}` : brand; }, [title, brand]);
}

export function useMedia(query: string) {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setM(mq.matches);
    on(); mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return m;
}

export function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

export function useLockScroll(lock: boolean) {
  useEffect(() => {
    if (!lock) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [lock]);
}
