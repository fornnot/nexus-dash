import type { PDFDocument } from 'pdf-lib';

/** Concatenates PDF documents in order into one new PDF. */
export async function mergePdfInputs(docs: PDFDocument[]): Promise<PDFDocument> {
  const { PDFDocument } = await import('pdf-lib');
  const out = await PDFDocument.create();
  for (const doc of docs) {
    const copied = await out.copyPages(doc, doc.getPageIndices());
    for (const p of copied) out.addPage(p);
  }
  return out;
}
