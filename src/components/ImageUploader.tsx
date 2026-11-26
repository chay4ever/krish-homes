import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { uploadImage } from "@/lib/api";
import { useApp } from "@/lib/app";

export function ImageUploader({ value, onChange, max = 12, single }: { value: string[]; onChange: (v: string[]) => void; max?: number; single?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const { toast } = useApp();
  const up = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, single ? 1 : max - value.length);
    setBusy(list.length);
    const out: string[] = [];
    for (const f of list) { try { out.push(await uploadImage(f)); } catch (e: any) { toast(e.message, "error"); } finally { setBusy((b) => b - 1); } }
    onChange(single ? out : [...value, ...out]);
    if (ref.current) ref.current.value = "";
  };
  return (
    <div className="grid grid-cols-4 gap-2">
      {value.map((s) => <div key={s} className="relative aspect-square overflow-hidden rounded-xl bg-surface"><img src={s} alt="" className="size-full object-cover" /><button type="button" onClick={() => onChange(value.filter((x) => x !== s))} className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-white/90 text-danger" aria-label="Remove"><Trash2 size={13} /></button></div>)}
      {Array.from({ length: busy }, (_, i) => <div key={i} className="grid aspect-square place-items-center rounded-xl bg-surface"><Loader2 className="animate-spin text-brand-600" size={18} /></div>)}
      {(single ? value.length === 0 : value.length + busy < max) && <button type="button" onClick={() => ref.current?.click()} className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/60 text-brand-700"><ImagePlus size={22} /></button>}
      <input ref={ref} type="file" accept="image/*" multiple={!single} hidden onChange={(e) => up(e.target.files)} />
    </div>
  );
}
