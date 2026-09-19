/**
 * The intermediate document model. Every supported input format is parsed
 * into these blocks; the renderer knows one job — laying blocks out on A4.
 *
 * Supported input formats: HTML, Markdown, DOCX, RTF, TXT, JSON, CSV, TSV,
 * XLS/XLSX, PDF, and images (PNG/JPEG/WebP/GIF/BMP/AVIF).
 */

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ListItemBlock
  | TableBlock
  | ImageBlock
  | DividerBlock
  | PageBreakBlock;

export interface HeadingBlock {
  type: 'heading';
  /** Heading level 1–3; deeper levels render as level 3. */
  level: 1 | 2 | 3;
  runs: InlineRun[];
}

export interface ParagraphBlock {
  type: 'paragraph';
  runs: InlineRun[];
  /** Extra vertical space before the paragraph (e.g. after lists). */
  spacing?: number;
}

export interface ListItemBlock {
  type: 'listItem';
  /** 1-based indentation level; deeper levels clamp to 3. */
  level: 1 | 2 | 3;
  marker: '•' | '–' | string;
  runs: InlineRun[];
}

export interface TableBlock {
  type: 'table';
  /** Header row: one entry per cell; each cell is a list of styled runs. */
  header: InlineRun[][];
  rows: InlineRun[][][];
}

export interface ImageBlock {
  type: 'image';
  dataUrl: string;
}

export interface DividerBlock {
  type: 'divider';
}

export interface PageBreakBlock {
  type: 'pageBreak';
}

export type InlineRun =
  | { text: string; bold?: boolean; italic?: boolean; code?: boolean; link?: string };

export interface ConvertOptions {
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margin: number;
  fontSize: number;
  title?: string;
  includeImages: boolean;
}

export const DEFAULT_OPTIONS: ConvertOptions = {
  pageSize: 'A4',
  orientation: 'portrait',
  margin: 48,
  fontSize: 11,
  includeImages: true,
};

export const heading = (level: 1 | 2 | 3, text: string): HeadingBlock => ({
  type: 'heading',
  level,
  runs: [{ text }],
});

export const para = (text: string, spacing = 0): ParagraphBlock => ({
  type: 'paragraph',
  runs: [{ text }],
  spacing,
});
