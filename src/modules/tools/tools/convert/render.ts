import type { PDFFont, PDFPage } from 'pdf-lib';
import { DEFAULT_OPTIONS } from './docModel';
import type { Block, ConvertOptions, InlineRun, TableBlock } from './docModel';

/* A4/Letter sizes in points, [width, height] portrait. */
const PAGE_SIZES = {
  A4: [595.28, 841.89],
  Letter: [612, 792],
} as const;

const LINE = 1.42; // line-height multiplier
const LIST_INDENT = 18;
const CODE_DELTA = -1;

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
  mono: PDFFont;
}

/** WinAnsi-safe: chars outside Latin-1 (and stray controls) become `?`. */
export function sanitize(text: string): string {
  return Array.from(text)
    .map((ch) => {
      const c = ch.codePointAt(0) ?? 0;
      return c === 0x09 || c === 0x0a || c === 0x0d || (c >= 0x20 && c <= 0xff) ? ch : '?';
    })
    .join('');
}

/** Draw text; returns the width actually used. WinAnsi-safe. */
function drawSanitized(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  opts: { size: number; font: PDFFont },
): number {
  const cleaned = sanitize(text).replace(/\r/g, '').replace(/\t/g, '  ');
  const width = opts.font.widthOfTextAtSize(cleaned, opts.size);
  if (cleaned) page.drawText(cleaned, { x, y, size: opts.size, font: opts.font });
  return width;
}

const runsToText = (runs: InlineRun[]): string => runs.map((r) => r.text).join('');

/** Greedy word-wrap across mixed-style runs, respecting an x offset and max width. */
function wrapRuns(
  runs: InlineRun[],
  fonts: Fonts,
  size: number,
  maxWidth: number,
  xOffset: number,
): Array<{ parts: Array<{ run: InlineRun; text: string }>; width: number }> {
  type Word = { run: InlineRun; text: string; width: number };
  const words: Word[] = [];
  const pushWord = (run: InlineRun, text: string) => {
    if (!text) return;
    const font = fontFor(run, fonts);
    words.push({ run, text, width: font.widthOfTextAtSize(sanitize(text), size) });
  };
  for (const run of runs) {
    const font = fontFor(run, fonts);
    const clean = sanitize(run.text);
    const segments = clean.split(/(\s+)/);
    for (const seg of segments) {
      if (seg === '') continue;
      if (/^\s+$/.test(seg)) {
        pushWord(run, ' ');
      } else if (font.widthOfTextAtSize(seg, size) > maxWidth) {
        // Hard-break very long tokens (URLs, unbroken strings).
        let chunk = '';
        for (const ch of seg) {
          if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth && chunk) {
            pushWord(run, chunk);
            chunk = ch;
          } else chunk += ch;
        }
        if (chunk) pushWord(run, chunk);
      } else {
        pushWord(run, seg);
      }
    }
  }

  const lines: Array<{ parts: Array<{ run: InlineRun; text: string }>; width: number }> = [];
  let parts: Array<{ run: InlineRun; text: string }> = [];
  let width = 0;
  for (const word of words) {
    if (width + word.width > maxWidth && width > 0) {
      // Trim trailing space of the finished line.
      if (parts.length && parts[parts.length - 1].text === ' ') {
        width -= words.length ? fontFor(parts[parts.length - 1].run, fonts).widthOfTextAtSize(' ', size) : 0;
        parts.pop();
      }
      lines.push({ parts, width });
      parts = [];
      width = 0;
    }
    parts.push({ run: word.run, text: word.text });
    width += word.width;
  }
  if (parts.length || lines.length === 0) lines.push({ parts, width });
  void xOffset;
  return lines;
}

function fontFor(run: InlineRun, fonts: Fonts): PDFFont {
  if (run.code) return fonts.mono;
  if (run.bold && run.italic) return fonts.boldItalic;
  if (run.bold) return fonts.bold;
  if (run.italic) return fonts.italic;
  return fonts.regular;
}

/** Exported for the image rasterizer, which shares page geometry. */
export function pageDims(options: ConvertOptions): [number, number] {
  const [w, h] = PAGE_SIZES[options.pageSize];
  return options.orientation === 'landscape' ? [h, w] : [w, h];
}

interface Ctx {
  pdf: import('pdf-lib').PDFDocument;
  page: PDFPage;
  y: number;
  fonts: Fonts;
  options: ConvertOptions;
  contentWidth: number;
}

function newPage(ctx: Ctx): void {
  ctx.page = ctx.pdf.addPage(pageDims(ctx.options));
  ctx.y = pageDims(ctx.options)[1] - ctx.options.margin;
}

function ensureSpace(ctx: Ctx, needed: number): void {
  if (ctx.y - needed < ctx.options.margin) newPage(ctx);
}

function drawRunsLine(
  ctx: Ctx,
  parts: Array<{ run: InlineRun; text: string }>,
  x: number,
  size: number,
): void {
  let cx = x;
  for (const part of parts) {
    const font = fontFor(part.run, ctx.fonts);
    const fs = part.run.code ? size + CODE_DELTA : size;
    if (part.run.link) {
      ctx.page.drawLine({
        start: { x: cx, y: ctx.y - 1.5 },
        end: { x: cx + ctx.fonts.regular.widthOfTextAtSize(sanitize(part.text), fs), y: ctx.y - 1.5 },
        thickness: 0.5,
        color: undefined,
      });
    }
    drawSanitized(ctx.page, part.text, cx, ctx.y, { size: fs, font });
    cx += font.widthOfTextAtSize(sanitize(part.text), fs);
  }
}

function drawParagraphLike(
  ctx: Ctx,
  runs: InlineRun[],
  size: number,
  indent: number,
  spacing: number,
  minLines = 1,
): void {
  const maxWidth = ctx.contentWidth - indent;
  const lines = wrapRuns(runs, ctx.fonts, size, maxWidth, indent);
  const lineH = size * LINE;
  ensureSpace(ctx, lineH * Math.min(minLines, lines.length));
  for (const line of lines) {
    ensureSpace(ctx, lineH);
    drawRunsLine(ctx, line.parts, ctx.options.margin + indent, size);
    ctx.y -= lineH;
  }
  if (spacing) ctx.y -= spacing;
}

function drawHeading(ctx: Ctx, block: Extract<Block, { type: 'heading' }>): void {
  const sizes = { 1: 1.7, 2: 1.35, 3: 1.15 } as const;
  const size = Math.round(ctx.options.fontSize * sizes[block.level]);
  const before = block.level === 1 ? 10 : 6;
  const after = 4;
  ctx.y -= before;
  drawParagraphLike(ctx, block.runs, size, 0, after);
}

function drawListItem(ctx: Ctx, block: Extract<Block, { type: 'listItem' }>): void {
  const indent = LIST_INDENT * (block.level - 1);
  const markerWidth = 14;
  const size = ctx.options.fontSize;
  const lineH = size * LINE;
  const maxWidth = ctx.contentWidth - indent - markerWidth;
  const lines = wrapRuns(block.runs, ctx.fonts, size, maxWidth, indent + markerWidth);
  let first = true;
  for (const line of lines) {
    ensureSpace(ctx, lineH);
    if (first) {
      drawSanitized(ctx.page, block.marker, ctx.options.margin + indent, ctx.y, {
        size,
        font: ctx.fonts.regular,
      });
      first = false;
    }
    drawRunsLine(ctx, line.parts, ctx.options.margin + indent + markerWidth, size);
    ctx.y -= lineH;
  }
}

function drawTable(ctx: Ctx, block: TableBlock): void {
  const size = ctx.options.fontSize - 0.5;
  const lineH = size * LINE;
  const cols = Math.max(block.header.length, ...block.rows.map((r) => r.length), 1);
  if (cols === 0) return;

  const cellText = (runs: InlineRun[]): string => runsToText(runs).trim();
  const headers = Array.from({ length: cols }, (_, i) => cellText(block.header[i] ?? []));
  const rows = block.rows.map((r) => Array.from({ length: cols }, (_, i) => cellText(r[i] ?? [])));

  // Column widths from content, normalized to content width.
  const measure = (s: string) => ctx.fonts.bold.widthOfTextAtSize(sanitize(s), size);
  const weights = Array.from({ length: cols }, (_, i) => {
    const content = [headers[i] ?? '', ...rows.map((r) => r[i] ?? '')];
    const longest = content.reduce((a, b) => (measure(b) > measure(a) ? b : a), '');
    return Math.max(24, Math.min(260, measure(longest) + 12));
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map((w) => (w / total) * ctx.contentWidth);

  const drawRow = (cells: string[], bold: boolean) => {
    const font = bold ? ctx.fonts.bold : ctx.fonts.regular;
    const cellLines = cells.map((c, i) =>
      wrapRuns([{ text: c }], ctx.fonts, size, widths[i] - 8, 0).map((l) => l.parts),
    );
    const rowHeight = Math.max(
      lineH,
      ...cellLines.map((lines) => lines.length * lineH),
    );
    ensureSpace(ctx, rowHeight + 6);
    const yTop = ctx.y;
    const heights: number[] = [];
    cells.forEach((_, i) => {
      let cy = yTop;
      for (const line of cellLines[i]) {
        let cx = ctx.options.margin + widths.slice(0, i).reduce((a, b) => a + b, 0) + 4;
        for (const part of line) {
          drawSanitized(ctx.page, part.text, cx, cy - size, { size, font: part.run.bold ? ctx.fonts.bold : font });
          cx += ctx.fonts.regular.widthOfTextAtSize(sanitize(part.text), size);
        }
        cy -= lineH;
      }
      heights.push(yTop - cy);
    });
    // Row rules.
    ctx.page.drawLine({
      start: { x: ctx.options.margin, y: yTop - rowHeight - 2 },
      end: { x: ctx.options.margin + ctx.contentWidth, y: yTop - rowHeight - 2 },
      thickness: 0.5,
      color: undefined,
    });
    ctx.y = yTop - rowHeight - 6;
    void heights;
  };

  if (headers.some((h) => h)) drawRow(headers, true);
  for (const r of rows) drawRow(r, false);
}

async function drawImage(ctx: Ctx, dataUrl: string): Promise<void> {
  try {
    let embedded: import('pdf-lib').PDFImage;
    const bytes = await (await fetch(dataUrl)).arrayBuffer();
    if (/^data:image\/png/i.test(dataUrl)) embedded = await ctx.pdf.embedPng(bytes);
    else if (/^data:image\/jpe?g/i.test(dataUrl)) embedded = await ctx.pdf.embedJpg(bytes);
    else {
      // Non-embeddable formats (webp/gif/bmp): rasterize through canvas.
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('image decode failed'));
        img.src = dataUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      const png = canvas.toDataURL('image/png');
      embedded = await ctx.pdf.embedPng(await (await fetch(png)).arrayBuffer());
    }
    const dims = pageDims(ctx.options);
    const maxW = ctx.contentWidth;
    const maxH = dims[1] - ctx.options.margin * 2;
    const scale = Math.min(1, maxW / embedded.width, maxH / embedded.height);
    const w = embedded.width * scale;
    const h = embedded.height * scale;
    ensureSpace(ctx, h + 8);
    if (h > dims[1] - ctx.options.margin * 2 - 4) newPage(ctx);
    ctx.page.drawImage(embedded, {
      x: ctx.options.margin,
      y: ctx.y - h,
      width: w,
      height: h,
    });
    ctx.y -= h + 10;
  } catch {
    drawParagraphLike(ctx, [{ text: '[image could not be embedded]', italic: true }], ctx.options.fontSize - 1, 0, 4);
  }
}

/** Renders all blocks into a fresh PDFDocument. Partial options are filled from DEFAULT_OPTIONS. */
export async function renderBlocksToPdf(
  blocks: Block[],
  partialOptions: Partial<ConvertOptions> = {},
): Promise<import('pdf-lib').PDFDocument> {
  const options: ConvertOptions = { ...DEFAULT_OPTIONS, ...partialOptions };
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await pdf.embedFont(StandardFonts.HelveticaBoldOblique),
    mono: await pdf.embedFont(StandardFonts.Courier),
  };
  const [pw] = pageDims(options);
  const ctx: Ctx = {
    pdf,
    page: pdf.addPage(pageDims(options)),
    y: pageDims(options)[1] - options.margin,
    fonts,
    options,
    contentWidth: pw - options.margin * 2,
  };

  let any = false;
  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        any = true;
        drawHeading(ctx, block);
        break;
      case 'paragraph':
        if (block.runs.length) any = true;
        drawParagraphLike(ctx, block.runs, options.fontSize, 0, block.spacing ?? 2);
        break;
      case 'listItem':
        any = true;
        drawListItem(ctx, block);
        break;
      case 'table':
        any = true;
        drawTable(ctx, block);
        break;
      case 'image':
        any = true;
        if (options.includeImages) await drawImage(ctx, block.dataUrl);
        break;
      case 'divider':
        ctx.y -= 6;
        ctx.page.drawLine({
          start: { x: options.margin, y: ctx.y },
          end: { x: options.margin + ctx.contentWidth, y: ctx.y },
          thickness: 0.75,
          color: undefined,
        });
        ctx.y -= 10;
        break;
      case 'pageBreak':
        newPage(ctx);
        break;
    }
  }

  // Page numbers + optional title, muted grey.
  const pages = pdf.getPages();
  if (options.title && pages.length) {
    pages[0].drawText(sanitize(options.title).slice(0, 120), {
      x: options.margin,
      y: pageDims(options)[1] - options.margin + 16,
      size: 8,
      font: fonts.italic,
      color: rgb(0.45, 0.45, 0.45),
    });
  }
  pages.forEach((p, i) => {
    const label = `${i + 1} / ${pages.length}`;
    p.drawText(label, {
      x: pw - options.margin - fonts.regular.widthOfTextAtSize(label, 8),
      y: options.margin - 20 < 12 ? 12 : options.margin - 20,
      size: 8,
      font: fonts.regular,
      color: rgb(0.45, 0.45, 0.45),
    });
  });

  if (!any) {
    ctx.page.drawText('(empty document)', { x: options.margin, y: ctx.y, size: options.fontSize, font: fonts.regular });
  }
  return pdf;
}
