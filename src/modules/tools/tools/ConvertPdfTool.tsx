import { useRef, useState } from 'react';
import { Badge, Button } from '@/core/primitives';
import { Icon } from '@/core/icons';
import { SUPPORTED_FORMATS, classify, convertFiles } from './convert';
import type { ConvertResult } from './convert';
import type { ConvertOptions } from './convert/docModel';

const ACCEPT = SUPPORTED_FORMATS.map((f) => `.${f.ext}`).join(',');

interface Queued {
  id: number;
  file: File;
  baseName: string;
}

const CATEGORY_TONE: Record<string, 'cyan' | 'green' | 'amber' | 'violet' | 'neutral'> = {
  Document: 'cyan',
  Spreadsheet: 'green',
  Data: 'amber',
  Image: 'violet',
  PDF: 'neutral',
};

const CATEGORY_DOT: Record<string, string> = {
  Document: 'bg-cyan-400',
  Spreadsheet: 'bg-emerald-400',
  Data: 'bg-amber-400',
  Image: 'bg-violet-400',
  PDF: 'bg-zinc-500',
};

export function ConvertPdfTool() {
  const [queue, setQueue] = useState<Queued[]>([]);
  const [results, setResults] = useState<ConvertResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFormats, setShowFormats] = useState(false);
  const [options, setOptions] = useState<Partial<ConvertOptions>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setResults(null);
    setError(null);
    setQueue((prev) => [
      ...prev,
      ...Array.from(files).map((file) => ({ id: nextId.current++, file, baseName: file.name })),
    ]);
  };

  const remove = (id: number) => setQueue((prev) => prev.filter((q) => q.id !== id));

  const convert = async () => {
    if (queue.length === 0) return;
    setBusy(true);
    setError(null);
    setResults(null);
    try {
      const out = await convertFiles(
        queue.map(({ file, baseName }) => ({ file, baseName })),
        options,
      );
      setResults(out);
      // Auto-download single results; multi-results stay listed for choice.
      if (out.length === 1 && out[0].pageCount > 0) download(out[0]);
    } catch (e) {
      setError((e as Error).message || 'conversion failed');
    } finally {
      setBusy(false);
    }
  };

  const download = (r: ConvertResult) => {
    if (r.pageCount === 0) return;
    const blob = new Blob([r.bytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = r.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const setOpt = <K extends keyof ConvertOptions>(key: K, value: ConvertOptions[K]) =>
    setOptions((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Icon.pdf className="size-4 text-violet-300" /> PDF Converter
        </h3>
        <Badge tone="violet">100% offline</Badge>
      </div>

      <p className="mt-1 text-xs text-zinc-500">
        Documents, spreadsheets, data files and images → PDF, entirely on your device.
        PDFs in the queue are merged.
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {['Document', 'Spreadsheet', 'Data', 'Image', 'PDF'].map((cat) => (            <span key={cat} className="flex items-center gap-1 text-[11px] text-zinc-500">
              <span className={`inline-block size-1.5 rounded-full ${CATEGORY_DOT[cat]}`} />
              {cat}:{' '}
            {SUPPORTED_FORMATS.filter((f) => f.category === cat)
              .map((f) => f.label)
              .join(' · ')}
          </span>
        ))}
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <button
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
        className="mt-3 flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-700 text-sm text-zinc-500 hover:border-violet-500/50 hover:text-violet-300"
      >
        <Icon.file className="size-6" />
        Add files — they never leave your device
        <span className="text-[11px] text-zinc-600">
          DOCX · HTML · MD · RTF · TXT · CSV · TSV · XLS · XLSX · JSON · images · PDF
        </span>
      </button>

      {queue.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {queue.map((q) => {
            const kind = classify(q.file);
            const cat =
              kind === 'image'
                ? 'Image'
                : kind === 'pdf'
                  ? 'PDF'
                  : SUPPORTED_FORMATS.find((f) => f.ext === q.file.name.toLowerCase().split('.').pop())?.category ??
                    'Document';
            return (
              <li
                key={q.id}
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs"
              >
                <span className="min-w-0 flex-1 truncate text-zinc-300">{q.file.name}</span>
                <span className="text-[10px] text-zinc-500">{(q.file.size / 1024).toFixed(0)} kB</span>
                <Badge tone={CATEGORY_TONE[cat] ?? 'sky'}>{cat}</Badge>
                <button
                  onClick={() => remove(q.id)}
                  className="text-zinc-500 hover:text-red-400"
                  aria-label={`Remove ${q.file.name}`}
                >
                  <Icon.trash className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-[11px] text-zinc-500">Page size</span>
          <select
            value={options.pageSize ?? 'A4'}
            onChange={(e) => setOpt('pageSize', e.target.value as 'A4' | 'Letter')}
            className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-sm text-zinc-100 outline-none focus:border-violet-500/50"
          >
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] text-zinc-500">Orientation</span>
          <select
            value={options.orientation ?? 'portrait'}
            onChange={(e) => setOpt('orientation', e.target.value as 'portrait' | 'landscape')}
            className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-sm text-zinc-100 outline-none focus:border-violet-500/50"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] text-zinc-500">Font size</span>
          <select
            value={String(options.fontSize ?? 11)}
            onChange={(e) => setOpt('fontSize', Number(e.target.value))}
            className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-sm text-zinc-100 outline-none focus:border-violet-500/50"
          >
            {[9, 10, 11, 12, 14].map((s) => (
              <option key={s} value={s}>
                {s} pt
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-end gap-2 pb-1.5 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={options.includeImages ?? true}
            onChange={(e) => setOpt('includeImages', e.target.checked)}
            className="size-3.5 accent-violet-400"
          />
          Embed images
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="primary" onClick={convert} disabled={busy || queue.length === 0}>
          {busy ? 'Converting…' : `Convert (${queue.length})`}
        </Button>
        {queue.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => { setQueue([]); setResults(null); }}>
            Clear
          </Button>
        )}
        <button
          onClick={() => setShowFormats((v) => !v)}
          className="text-xs text-violet-300 hover:underline"
        >
          {showFormats ? 'Hide' : 'All supported formats'}
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>

      {showFormats && (
        <ul className="mt-3 grid gap-x-4 gap-y-1 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-[11px] text-zinc-400 sm:grid-cols-2">
          {SUPPORTED_FORMATS.map((f) => (
            <li key={f.ext} className="flex items-baseline gap-2">
              <Badge tone={CATEGORY_TONE[f.category]}>{f.label}</Badge>
              <span className="truncate">{f.hint}</span>
            </li>
          ))}
        </ul>
      )}

      {results && (
        <div className="mt-3 space-y-1.5">
          {results.map((r) => (
            <div
              key={r.name}
              className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs"
            >
              <Icon.pdf className="size-3.5 shrink-0 text-violet-300" />
              <span className="min-w-0 flex-1 truncate text-zinc-300">{r.name}</span>
              {r.pageCount > 0 ? (
                <>
                  <span className="text-[10px] text-zinc-500">{r.pageCount} page(s)</span>
                  <Button size="sm" onClick={() => download(r)}>
                    <Icon.download className="size-3.5" /> Save
                  </Button>
                </>
              ) : (
                <span className="text-[10px] text-red-400">{r.notes.join('; ')}</span>
              )}
            </div>
          ))}
          <p className="text-[11px] text-zinc-600">
            {results.length > 1
              ? 'Multiple outputs — tap Save for each. Documents convert individually; images and PDFs combine.'
              : 'Saved to your downloads.'}
          </p>
        </div>
      )}
    </div>
  );
}
