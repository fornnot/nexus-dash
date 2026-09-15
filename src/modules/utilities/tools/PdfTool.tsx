import { useState } from 'react';
import { Badge, Button } from '@/core/primitives';
import { Icon } from '@/core/icons';

// pdf-lib is ~350 kB minified; load it on first use so the module chunk stays light.
async function loadPdfLib() {
  const mod = await import('pdf-lib');
  return mod;
}

const PAGE_W = 595.28; // A4 portrait pt
const PAGE_H = 841.89;
const MARGIN = 48;
const LINE = 16;
const FONT_SIZE = 11;

export function PdfTool() {
  const [text, setText] = useState('Meeting notes — written offline, exported as PDF.\n\n• First point\n• Second point');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const generate = async () => {
    setBusy(true);
    setDone(null);
    try {
      const { PDFDocument, StandardFonts } = await loadPdfLib();
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      let page = pdf.addPage([PAGE_W, PAGE_H]);
      let y = PAGE_H - MARGIN;

      const newPage = () => {
        page = pdf.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - MARGIN;
      };

      for (const rawLine of text.split('\n')) {
        // Basic wrap at ~90 chars for Helvetica 11pt.
        for (const line of rawLine.match(/.{1,90}(\s|$)|\S+/g) ?? ['']) {
          if (y < MARGIN) newPage();
          page.drawText(line, { x: MARGIN, y, size: FONT_SIZE, font });
          y -= LINE;
        }
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.pdf';
      a.click();
      URL.revokeObjectURL(url);
      setDone(`${pdf.getPageCount()} page(s)`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Icon.pdf className="size-4 text-violet-300" /> Text → PDF
        </h3>
        <Badge tone="violet">100% offline</Badge>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        spellCheck={false}
        className="mt-3 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-200 outline-none focus:border-violet-500/50"
      />

      <div className="mt-2 flex items-center gap-3">
        <Button size="sm" variant="primary" onClick={generate} disabled={busy || !text.trim()}>
          {busy ? 'Generating…' : 'Generate PDF'}
        </Button>
        {done && <span className="text-xs text-emerald-400">✓ saved ({done})</span>}
      </div>
    </div>
  );
}
