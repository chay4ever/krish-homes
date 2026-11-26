import { getIdToken } from "./firebase";

export class ApiError extends Error { status: number; constructor(msg: string, status: number) { super(msg); this.status = status; } }

async function request<T>(method: string, url: string, body?: unknown, auth = true): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (auth) { const t = await getIdToken(); if (t) headers.Authorization = `Bearer ${t}`; }
  const res = await fetch(url, { method, headers, credentials: "same-origin", body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as any)?.error ?? "Something went wrong", res.status);
  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, body?: unknown) => request<T>("POST", url, body ?? {}),
  put: <T>(url: string, body?: unknown) => request<T>("PUT", url, body ?? {}),
  patch: <T>(url: string, body?: unknown) => request<T>("PATCH", url, body ?? {}),
  del: <T>(url: string) => request<T>("DELETE", url),
};

export async function uploadImage(file: File): Promise<string> {
  const f = await compress(file);
  const fd = new FormData();
  fd.append("file", f);
  const r = await request<{ url: string }>("POST", "/api/upload", fd);
  return r.url;
}

/** Downscale big phone photos before upload (keeps uploads fast on mobile data). */
async function compress(file: File, maxDim = 1800, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.size < 400 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/webp", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
  } catch { return file; }
}
