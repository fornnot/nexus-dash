import { useRef, useState } from 'react';
import { Badge, Button } from '@/core/primitives';
import { Icon } from '@/core/icons';

interface Loaded {
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

const FORMATS = [
  { value: 'image/png', label: 'PNG' },
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/webp', label: 'WebP' },
] as const;

type Format = (typeof FORMATS)[number]['value'];

export function ImageTool() {
  const [img, setImg] = useState<Loaded | null>(null);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [format, setFormat] = useState<Format>('image/png');
  const [quality, setQuality] = useState(90);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const probe = new Image();
      probe.onload = () => {
        setImg({ name: file.name, dataUrl, width: probe.width, height: probe.height });
        setWidth(String(probe.width));
        setHeight(String(probe.height));
        setPreview(null);
      };
      probe.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const setW = (w: number) => {
    setWidth(String(w));
    if (img && img.width > 0) setHeight(String(Math.round((w * img.height) / img.width)));
  };

  const setH = (h: number) => {
    setHeight(String(h));
    if (img && img.height > 0) setWidth(String(Math.round((h * img.width) / img.height)));
  };

  const resize = () => {
    if (!img) return;
    const w = Math.max(1, Number.parseInt(width) || img.width);
    const h = Math.max(1, Number.parseInt(height) || img.height);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(image, 0, 0, w, h);
      setPreview(canvas.toDataURL(format, quality / 100));
    };
    image.src = img.dataUrl;
  };

  const download = () => {
    if (!preview) return;
    const a = document.createElement('a');
    a.href = preview;
    const ext = format === 'image/png' ? 'png' : format === 'image/jpeg' ? 'jpg' : 'webp';
    a.download = img ? `${img.name.replace(/\.[^.]+$/, '')}-resized.${ext}` : `resized.${ext}`;
    a.click();
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Icon.image className="size-4 text-violet-300" /> Image Resizer
        </h3>
        <Badge tone="violet">100% offline</Badge>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && load(e.target.files[0])}
      />

      {!img ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="mt-3 flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 text-sm text-zinc-500 hover:border-violet-500/50 hover:text-violet-300"
        >
          <Icon.image className="size-6" />
          Choose an image — it never leaves your device
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-3">
            <img src={img.dataUrl} alt="source" className="size-16 rounded-lg border border-zinc-800 object-cover" />
            <div className="min-w-0 text-xs text-zinc-400">
              <div className="truncate font-medium text-zinc-300">{img.name}</div>
              <div>
                {img.width} × {img.height} px
              </div>
              <button className="text-violet-300 hover:underline" onClick={() => fileRef.current?.click()}>
                Replace
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-[11px] text-zinc-500">Width</span>
              <input
                inputMode="numeric"
                value={width}
                onChange={(e) => setW(Number.parseInt(e.target.value) || 0)}
                className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-sm text-zinc-100 outline-none focus:border-violet-500/50"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-zinc-500">Height</span>
              <input
                inputMode="numeric"
                value={height}
                onChange={(e) => setH(Number.parseInt(e.target.value) || 0)}
                className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-sm text-zinc-100 outline-none focus:border-violet-500/50"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-zinc-500">Format</span>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as Format)}
                className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-sm text-zinc-100 outline-none focus:border-violet-500/50"
              >
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-zinc-500">Quality {quality}%</span>
              <input
                type="range"
                min={30}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="mt-2 w-full accent-violet-400"
                disabled={format === 'image/png'}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="primary" onClick={resize}>
              Resize
            </Button>
            {[
              { label: '25%', s: 0.25 },
              { label: '50%', s: 0.5 },
              { label: '75%', s: 0.75 },
            ].map((p) => (
              <Button
                key={p.label}
                size="sm"
                onClick={() => {
                  setW(Math.round(img.width * p.s));
                }}
              >
                {p.label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={download} disabled={!preview}>
              <Icon.download className="size-3.5" /> Download
            </Button>
          </div>

          {preview && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <img src={preview} alt="resized preview" className="mx-auto max-h-48 rounded-lg object-contain" />
              <div className="mt-2 text-center text-[11px] text-zinc-500">
                {width} × {height} px preview
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
