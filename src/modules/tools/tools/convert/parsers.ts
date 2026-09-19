import { marked } from 'marked';
import type {
  Block,
  InlineRun,
  TableBlock,
} from './docModel';
import { heading, para } from './docModel';

export type SourceKind =
  | 'html'
  | 'markdown'
  | 'docx'
  | 'rtf'
  | 'text'
  | 'json'
  | 'csv'
  | 'tsv'
  | 'sheet';

/* ------------------------------- Inline runs ------------------------------ */

const runsFromText = (text: string, base: Partial<InlineRun> = {}): InlineRun[] =>
  text
    ? [{ text, ...base }]
    : [];

/** Minimal inline-HTML → runs conversion (b/i/strong/em/code/a, <br>). */
function inlineHtmlToRuns(html: string): InlineRun[] {
  const runs: InlineRun[] = [];
  const re = /<br\s*\/?>|<(\/?)(b|strong|i|em|code|a)\b[^>]*>|[^<]+/gi;
  const stack: Array<{ tag: string; href?: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const [raw, close, tag] = match;
    if (/^<br/i.test(raw)) {
      runs.push({ text: ' ' });
    } else if (tag) {
      const t = tag.toLowerCase();
      if (close) {
        const open = stack.pop();
        if (open?.tag === 'a' && open.href) {
          // Convert the just-collected link text into one linked run.
          const start = runs.length - 1;
          let text = '';
          for (let i = start; i < runs.length; i++) text += runs[i].text;
          runs.length = Math.max(start, 0);
          if (text.trim()) runs.push({ text, link: open.href });
        }
      } else if (t === 'a') {
        const href = /href\s*=\s*"([^"]*)"/i.exec(raw)?.[1];
        stack.push({ tag: 'a', href });
      } else {
        stack.push({ tag: t });
      }
    } else {
      const decoded = raw
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
      const state = stack.reduce(
        (acc, s) => ({
          bold: acc.bold || s.tag === 'b' || s.tag === 'strong',
          italic: acc.italic || s.tag === 'i' || s.tag === 'em',
          code: acc.code || s.tag === 'code',
        }),
        { bold: false, italic: false, code: false },
      );
      const inLink = stack.find((s) => s.tag === 'a');
      runs.push({ text: decoded, ...state, ...(inLink?.href ? { link: inLink.href } : {}) });
    }
  }
  return runs;
}

const plainRuns = (html: string): InlineRun[] =>
  runsFromText(
    html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );

/* ---------------------------------- HTML ---------------------------------- */

export function buildDocFromHtml(html: string): Block[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks: Block[] = [];

  const walk = (node: Element, listLevel: number) => {
    for (const el of Array.from(node.children)) {
      const tag = el.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) {
        const level = Math.min(3, Number.parseInt(tag[1], 10)) as 1 | 2 | 3;
        blocks.push({ type: 'heading', level, runs: inlineHtmlToRuns(el.innerHTML) });
      } else if (tag === 'p') {
        blocks.push({ type: 'paragraph', runs: inlineHtmlToRuns(el.innerHTML) });
      } else if (tag === 'blockquote') {
        for (const p of Array.from(el.querySelectorAll('p')))
          blocks.push({ type: 'paragraph', runs: inlineHtmlToRuns(p.innerHTML), spacing: 4 });
        if (!el.querySelector('p'))
          blocks.push({ type: 'paragraph', runs: plainRuns(el.innerHTML), spacing: 4 });
      } else if (tag === 'ul' || tag === 'ol') {
        const ordered = tag === 'ol';
        Array.from(el.children).forEach((li, i) => {
          const marker = ordered ? `${i + 1}.` : '•';
          const level = Math.min(3, Math.max(1, listLevel)) as 1 | 2 | 3;
          const nested = li.querySelectorAll(':scope > ul, :scope > ol');
          // Direct text of the li (excluding nested lists).
          li.querySelectorAll(':scope > ul, :scope > ol').forEach((n) => n.remove());
          blocks.push({
            type: 'listItem',
            level,
            marker,
            runs: inlineHtmlToRuns(li.innerHTML.trim() || ' '),
          });
          for (const n of Array.from(nested)) walk({ children: [n] } as unknown as Element, listLevel + 1);
        });
      } else if (tag === 'table') {
        const table = tableFromElement(el);
        if (table) blocks.push(table);
      } else if (tag === 'img') {
        const src = el.getAttribute('src');
        if (src?.startsWith('data:')) blocks.push({ type: 'image', dataUrl: src });
      } else if (tag === 'hr') {
        blocks.push({ type: 'divider' });
      } else if (tag === 'pre') {
        for (const line of (el.textContent ?? '').split('\n'))
          blocks.push({ type: 'paragraph', runs: [{ text: line, code: true }] });
      } else if (['div', 'section', 'article', 'main', 'body', 'header', 'footer', 'td', 'li'].includes(tag)) {
        walk(el, listLevel);
      } else if (['br'].includes(tag)) {
        // skip
      } else {
        const text = el.textContent?.trim();
        if (text) blocks.push({ type: 'paragraph', runs: runsFromText(text) });
      }
    }
  };

  const body = doc.body;
  // Strip non-content noise first.
  body.querySelectorAll('script,style,noscript,nav,svg,iframe,form,button').forEach((n) => n.remove());
  const title = doc.title?.trim();
  if (title) blocks.push(heading(1, title));
  if (body.children.length === 0 && body.textContent?.trim()) {
    blocks.push(para(body.textContent.trim()));
  } else {
    walk(body, 1);
  }
  return blocks.length ? blocks : [para(html.replace(/<[^>]*>/g, ' ').trim())];
}

function tableFromElement(el: Element): TableBlock | null {
  const rows = Array.from(el.querySelectorAll('tr'));
  if (rows.length === 0) return null;
  const cellsOf = (tr: Element) =>
    Array.from(tr.querySelectorAll('th,td')).map((td) => inlineHtmlToRuns(td.innerHTML));
  const header = el.querySelector('th') ? cellsOf(rows[0]) : [];
  const bodyRows = (header ? rows.slice(1) : rows).map(cellsOf).filter((r) => r.length > 0);
  if (!header && bodyRows.length === 0) return null;
  return { type: 'table', header, rows: bodyRows };
}

/* -------------------------------- Markdown -------------------------------- */

export function buildDocFromMarkdown(md: string): Block[] {
  // marked gives us HTML; reuse the HTML walker for consistent semantics.
  const html = marked.parse(md, { async: false, gfm: true, breaks: false }) as string;
  return buildDocFromHtml(html);
}

/* ---------------------------------- DOCX ---------------------------------- */

/** DOCX via mammoth: HTML with data-URI images when `includeImages` is on. */
export async function buildDocFromDocx(
  buf: ArrayBuffer,
  includeImages: boolean,
): Promise<Block[]> {
  const mammoth = await import('mammoth');
  const result = await mammoth.convertToHtml({ arrayBuffer: buf });
  // Image skipping happens at render time via `options.includeImages`.
  void includeImages;
  return buildDocFromHtml(result.value);
}

/* ----------------------------------- RTF ---------------------------------- */

/** Pragmatic RTF → blocks: control words stripped, paragraphs retained. */
export function buildDocFromRtf(rtf: string): Block[] {
  // Remove binary picture data up-front so it can't confuse the tokenizer.
  const cleaned = rtf.replace(/\{\\\*?\\pict[\s\S]*?\}/g, ' ').replace(/\\pict[\s\S]*?\\par/g, ' ');
  const groups: string[] = [];
  let depth = 0;
  let current = '';
  let skipDepth = -1;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '{') {
      if (skipDepth === -1 && /\\\*(?!\\)/.test(cleaned.slice(i, i + 3))) skipDepth = depth;
      depth++;
      continue;
    }
    if (ch === '}') {
      depth--;
      if (skipDepth === depth) skipDepth = -1;
      continue;
    }
    if (ch === '\\' && skipDepth === -1) {
      const dest = /^\\([a-z]+|-?\d+|[*])/i.exec(cleaned.slice(i));
      if (dest) {
        const word = dest[1].toLowerCase();
        if (word === 'par' || word === 'line' || word === 'sect') {
          groups.push(current);
          current = '';
          i += dest[0].length - 1;
          if (cleaned[i + 1] === '\n') i++;
          continue;
        }
        if (word === 'tab') {
          current += '\t';
          i += dest[0].length - 1;
          continue;
        }
        if (word === 'u') {
          const code = /^\\u(-?\d+)/.exec(cleaned.slice(i))?.[1];
          if (code) {
            current += String.fromCharCode(((Number(code) + 65536) % 65536));
            i += dest[0].length - 1;
            // skip following fallback char
            if (cleaned[i + 1] === '\\') i += 2;
            continue;
          }
        }
        if (word === 'fonttbl' || word === 'colortbl' || word === 'stylesheet' || word === 'info') {
          skipDepth = depth;
          i += dest[0].length - 1;
          continue;
        }
        i += dest[0].length - 1;
        if (cleaned[i + 1] === ' ') i++;
        continue;
      }
      if (cleaned[i + 1] === "'" ) {
        const hex = /^[\\']([0-9a-f]{2})/i.exec(cleaned.slice(i))?.[1];
        if (hex) {
          current += String.fromCharCode(Number.parseInt(hex, 16));
          i += 2;
          continue;
        }
      }
      if (cleaned[i + 1] === '\\' || cleaned[i + 1] === '{' || cleaned[i + 1] === '}') {
        current += cleaned[i + 1];
        i++;
        continue;
      }
      continue;
    }
    if (skipDepth === -1 && ch !== '\n' && ch !== '\r') current += ch;
  }
  groups.push(current);

  const blocks: Block[] = groups
    .map((g) => g.replace(/\\[a-z]+-?\d* ?/g, '').replace(/\s+$/g, ''))
    .filter((g) => g.trim().length > 0)
    .map((g) => ({ type: 'paragraph' as const, runs: runsFromText(g.replace(/\s+/g, ' ').trim()) }));

  return blocks.length ? blocks : [para('(empty RTF document)')];
}

/* --------------------------- JSON / CSV / Sheets --------------------------- */

function tableFromMatrix(header: string[], rows: string[][], title?: string): Block[] {
  const blocks: Block[] = [];
  if (title) blocks.push(heading(2, title));
  blocks.push({
    type: 'table',
    header: header.map((h) => [{ text: h }]),
    rows: rows.map((r) => r.map((c) => [{ text: c }])),
  });
  return blocks;
}

export function buildDocFromJson(json: string): Block[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (e) {
    return [para(`Could not parse JSON: ${(e as Error).message}`)];
  }

  const blocks: Block[] = [];

  const scalarTable = (obj: Record<string, unknown>, title?: string) =>
    tableFromMatrix(
      ['Key', 'Value'],
      Object.entries(obj).map(([k, v]) => [
        k,
        typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v),
      ]),
      title,
    );

  if (Array.isArray(data)) {
    if (data.length > 0 && data.every((r) => typeof r === 'object' && r !== null && !Array.isArray(r))) {
      const cols = [...new Set(data.flatMap((r) => Object.keys(r as object)))];
      blocks.push(
        ...tableFromMatrix(
          cols,
          data.map((r) => cols.map((c) => {
            const v = (r as Record<string, unknown>)[c];
            return typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '');
          })),
          `Array of ${data.length} records`,
        ),
      );
    } else {
      data.forEach((item, i) =>
        blocks.push({ type: 'listItem', level: 1, marker: `${i + 1}.`, runs: runsFromText(JSON.stringify(item)) }),
      );
    }
  } else if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data as Record<string, unknown>);
    const arrayEntries = entries.filter(([, v]) => Array.isArray(v));
    const scalarEntries = entries.filter(([, v]) => !Array.isArray(v));
    if (scalarEntries.length)
      blocks.push(...scalarTable(Object.fromEntries(scalarEntries), 'Summary'));
    for (const [key, value] of arrayEntries) {
      const rows = value as unknown[];
      if (rows.length > 0 && rows.every((r) => typeof r === 'object' && r !== null)) {
        const cols = [...new Set(rows.flatMap((r) => Object.keys(r as object)))];
        blocks.push(
          ...tableFromMatrix(
            cols,
            rows.map((r) =>
              cols.map((c) => {
                const v = (r as Record<string, unknown>)[c];
                return typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '');
              }),
            ),
            key,
          ),
        );
      } else {
        blocks.push(...tableFromMatrix([key, 'Items'], rows.map((r, i) => [String(i), JSON.stringify(r)]), key));
      }
    }
  } else {
    blocks.push(para(JSON.stringify(data)));
  }
  return blocks;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(cell);
      cell = '';
    } else {
      cell += ch;
    }
  }
  cells.push(cell);
  return cells.map((c) => c.trim());
}

export function buildDocFromDelimited(text: string, delimiter: string, title: string): Block[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [para('(empty file)')];
  const matrix = lines.map((l) => splitCsvLine(l, delimiter));
  const [header, ...rows] = matrix;
  return tableFromMatrix(header, rows, title);
}

export async function buildDocFromSheet(buf: ArrayBuffer): Promise<Block[]> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buf, { type: 'array' });
  const blocks: Block[] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    if (!sheet) continue;
    const matrix = (XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '' }) as string[][])
      .filter((row) => row.some((c) => String(c).trim() !== ''));
    if (matrix.length === 0) continue;
    const [header, ...rows] = matrix;
    blocks.push(
      ...tableFromMatrix(
        header.map((h) => String(h)),
        rows.map((r) => r.map((c) => String(c ?? ''))),
        wb.SheetNames.length > 1 ? name : undefined,
      ),
    );
    blocks.push({ type: 'paragraph', runs: [] });
  }
  return blocks.length ? blocks : [para('(workbook has no data)')];
}

/* --------------------------- Dispatch by extension ------------------------- */

export function kindForFile(name: string): SourceKind | null {
  const ext = name.toLowerCase().split('.').pop() ?? '';
  switch (ext) {
    case 'html':
    case 'htm':
      return 'html';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'docx':
      return 'docx';
    case 'rtf':
      return 'rtf';
    case 'txt':
    case 'log':
      return 'text';
    case 'json':
      return 'json';
    case 'csv':
      return 'csv';
    case 'tsv':
      return 'tsv';
    case 'xls':
    case 'xlsx':
      return 'sheet';
    default:
      return null;
  }
}

export async function parseDocument(
  kind: SourceKind,
  buf: ArrayBuffer,
  name: string,
  includeImages: boolean,
): Promise<Block[]> {
  switch (kind) {
    case 'html':
      return buildDocFromHtml(new TextDecoder().decode(buf));
    case 'markdown':
      return buildDocFromMarkdown(new TextDecoder().decode(buf));
    case 'docx':
      return buildDocFromDocx(buf, includeImages);
    case 'rtf':
      return buildDocFromRtf(new TextDecoder().decode(buf));
    case 'text':
      return new TextDecoder()
        .decode(buf)
        .split(/\r?\n/)
        .map((line) => ({ type: 'paragraph' as const, runs: [{ text: line }] }));
    case 'json':
      return buildDocFromJson(new TextDecoder().decode(buf));
    case 'csv':
      return buildDocFromDelimited(new TextDecoder().decode(buf), ',', name);
    case 'tsv':
      return buildDocFromDelimited(new TextDecoder().decode(buf), '\t', name);
    case 'sheet':
      return buildDocFromSheet(buf);
  }
}
