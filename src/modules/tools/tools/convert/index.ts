import {
  DEFAULT_OPTIONS,
  heading,
  para,
} from './docModel';
import type {
  Block,
  ConvertOptions,
  InlineRun,
} from './docModel';
import type { PDFDocument } from 'pdf-lib';
import type { SourceKind } from './parsers';
import { rasterizeImagesToPdf } from './images';
import { mergePdfInputs } from './merge';

export { DEFAULT_OPTIONS } from './docModel';
export type { ConvertOptions } from './docModel';

/* ------------------------------ Format catalog ----------------------------- */

export interface FormatInfo {
  /** Canonical file extension (lowercase, no dot). */
  ext: string;
  /** Short uppercase label for the badge. */
  label: string;
  category: 'Document' | 'Spreadsheet' | 'Data' | 'Image' | 'PDF';
  hint: string;
}

/** Every format this tool can read. The registry drives the UI badges. */
export const SUPPORTED_FORMATS: FormatInfo[] = [
  { ext: 'docx', label: 'DOCX', category: 'Document', hint: 'Word document (headings, lists, tables, images)' },
  { ext: 'html', label: 'HTML', category: 'Document', hint: 'Web page or saved .htm file' },
  { ext: 'htm', label: 'HTM', category: 'Document', hint: 'Web page' },
  { ext: 'md', label: 'MD', category: 'Document', hint: 'Markdown (headings, lists, tables, links)' },
  { ext: 'rtf', label: 'RTF', category: 'Document', hint: 'Rich text — paragraphs as plain text' },
  { ext: 'txt', label: 'TXT', category: 'Document', hint: 'Plain text / .log files' },
  { ext: 'csv', label: 'CSV', category: 'Spreadsheet', hint: 'Comma-separated table' },
  { ext: 'tsv', label: 'TSV', category: 'Spreadsheet', hint: 'Tab-separated table' },
  { ext: 'xlsx', label: 'XLSX', category: 'Spreadsheet', hint: 'Excel workbook — every sheet becomes a table' },
  { ext: 'xls', label: 'XLS', category: 'Spreadsheet', hint: 'Legacy Excel workbook' },
  { ext: 'json', label: 'JSON', category: 'Data', hint: 'Arrays/objects → clean tables' },
  { ext: 'png', label: 'PNG', category: 'Image', hint: 'One image per page' },
  { ext: 'jpg', label: 'JPG', category: 'Image', hint: 'One image per page' },
  { ext: 'jpeg', label: 'JPEG', category: 'Image', hint: 'One image per page' },
  { ext: 'webp', label: 'WEBP', category: 'Image', hint: 'Rasterized via canvas' },
  { ext: 'gif', label: 'GIF', category: 'Image', hint: 'First frame' },
  { ext: 'bmp', label: 'BMP', category: 'Image', hint: 'Rasterized via canvas' },
  { ext: 'avif', label: 'AVIF', category: 'Image', hint: 'Where the browser can decode it' },
  { ext: 'pdf', label: 'PDF', category: 'PDF', hint: 'Selected PDFs merge into one document' },
];

const IMAGE_MIME = /^(image\/(png|jpeg|webp|gif|bmp|avif))$/i;

const isImageKind = (kind: SourceKind | 'image' | 'pdf'): kind is 'image' => kind === 'image';

/* --------------------------------- Pipeline -------------------------------- */

export interface ConvertResult {
  /** Output file name. */
  name: string;
  bytes: Uint8Array;
  pageCount: number;
  /** Notes, e.g. failure reasons. */
  notes: string[];
}

export type FileKind = SourceKind | 'image' | 'pdf';

export function classify(file: File): FileKind {
  if (file.type && IMAGE_MIME.test(file.type)) return 'image';
  const fromExt = kindForFileLocal(file.name);
  if (fromExt) return fromExt;
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('image/')) return 'image';
  return 'text';
}

function kindForFileLocal(name: string): SourceKind | null {
  const ext = name.toLowerCase().split('.').pop() ?? '';
  const map: Record<string, SourceKind> = {
    html: 'html',
    htm: 'html',
    md: 'markdown',
    markdown: 'markdown',
    docx: 'docx',
    rtf: 'rtf',
    txt: 'text',
    log: 'text',
    json: 'json',
    csv: 'csv',
    tsv: 'tsv',
    xls: 'sheet',
    xlsx: 'sheet',
  };
  return map[ext] ?? null;
}

/** Everything that needs pdf-lib lives behind this dynamic import chain. */
async function fileToPdf(input: { file: File; kind: FileKind }, options: ConvertOptions): Promise<PDFDocument> {
  if (isImageKind(input.kind)) {
    const pdf = await rasterizeImagesToPdf([{ name: input.file.name, blob: input.file }], options);
    if (!pdf) throw new Error('no image');
    return pdf;
  }

  if (input.kind === 'pdf') {
    const { PDFDocument } = await import('pdf-lib');
    return PDFDocument.load(await input.file.arrayBuffer());
  }

  const { parseDocument } = await import('./parsers');
  const { renderBlocksToPdf } = await import('./render');
  const blocks = await parseDocument(
    input.kind,
    await input.file.arrayBuffer(),
    input.file.name,
    options.includeImages,
  );
  return renderBlocksToPdf(blocks, options);
}

const OUTPUT_RE = /\.pdf$/i;

export async function convertFiles(
  files: Array<{ file: File; baseName: string }>,
  partialOptions: Partial<ConvertOptions> = {},
): Promise<ConvertResult[]> {
  const options: ConvertOptions = { ...DEFAULT_OPTIONS, ...partialOptions };
  const results: ConvertResult[] = [];

  const pdfFiles = files.filter((f) => classify(f.file) === 'pdf');
  const imageFiles = files.filter((f) => isImageKind(classify(f.file)));
  const docFiles = files.filter((f) => {
    const k = classify(f.file);
    return k !== 'pdf' && !isImageKind(k);
  });

  // 1. Documents → one PDF each.
  for (const { file, baseName } of docFiles) {
    try {
      const pdf = await fileToPdf({ file, kind: classify(file) }, options);
      results.push({
        name: `${baseName.replace(OUTPUT_RE, '')}.pdf`,
        bytes: (await pdf.save()) as Uint8Array,
        pageCount: pdf.getPageCount(),
        notes: [],
      });
    } catch (e) {
      results.push({
        name: `${baseName.replace(OUTPUT_RE, '')}.pdf`,
        bytes: new Uint8Array(),
        pageCount: 0,
        notes: [`failed: ${(e as Error).message}`],
      });
    }
  }

  // 2. Images selected together → one combined PDF, one image per page.
  if (imageFiles.length > 0) {
    try {
      const pdf = await rasterizeImagesToPdf(
        imageFiles.map(({ file }) => ({ name: file.name, blob: file })),
        options,
      );
      if (pdf) {
        results.push({
          name: imageFiles.length === 1
            ? `${imageFiles[0].baseName.replace(OUTPUT_RE, '')}.pdf`
            : 'images.pdf',
          bytes: (await pdf.save()) as Uint8Array,
          pageCount: pdf.getPageCount(),
          notes: [],
        });
      }
    } catch (e) {
      results.push({
        name: 'images.pdf',
        bytes: new Uint8Array(),
        pageCount: 0,
        notes: [`image conversion failed: ${(e as Error).message}`],
      });
    }
  }

  // 3. PDFs selected together → merged into one (a single PDF is copied as-is).
  if (pdfFiles.length > 0) {
    try {
      const { PDFDocument } = await import('pdf-lib');
      const loaded = await Promise.all(
        pdfFiles.map(async ({ file }) => PDFDocument.load(await file.arrayBuffer())),
      );
      const merged = pdfFiles.length === 1 ? loaded[0] : await mergePdfInputs(loaded);
      results.push({
        name: pdfFiles.length === 1
          ? pdfFiles[0].baseName
          : 'merged.pdf',
        bytes: (await merged.save()) as Uint8Array,
        pageCount: merged.getPageCount(),
        notes: [],
      });
    } catch (e) {
      results.push({
        name: 'merged.pdf',
        bytes: new Uint8Array(),
        pageCount: 0,
        notes: [`PDF merge failed: ${(e as Error).message}`],
      });
    }
  }

  return results;
}

/** Convenience: convert a text snippet to PDF bytes. */
export async function convertTextToPdf(text: string, title?: string): Promise<Uint8Array> {
  const { renderBlocksToPdf } = await import('./render');
  const blocks: Block[] = text
    .split(/\n{2,}/)
    .map((chunk) => ({ type: 'paragraph' as const, runs: [{ text: chunk.replace(/\n/g, ' ') }] as InlineRun[] }));
  if (title) blocks.unshift(heading(1, title));
  if (blocks.length === 0) blocks.push(para(''));
  const pdf = await renderBlocksToPdf(blocks, { ...DEFAULT_OPTIONS, title });
  return (await pdf.save()) as Uint8Array;
}
