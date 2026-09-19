import type { PDFDocument } from 'pdf-lib';
import type { ConvertOptions } from './docModel';
import { pageDims } from './render';

const PT_TO_PX = 3; // render scale: 3px per pt ≈ 216 dpi

/**
 * Rasterizes image files (PNG/JPEG/WebP/GIF/BMP/AVIF — anything the browser
 * can decode) into one PDF, one image per page, sized to the page margins.
 */
export async function rasterizeImagesToPdf(
  images: Array<{ name: string; blob: Blob }>,
  options: ConvertOptions,
): Promise<PDFDocument | null> {
  if (images.length === 0) return null;
  const { PDFDocument } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  const [pw, ph] = pageDims(options);
  const maxW = pw - options.margin * 2;
  const maxH = ph - options.margin * 2;

  for (const { blob } of images) {
    const dataUrl = await new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.onerror = () => rej(new Error('read failed'));
      fr.readAsDataURL(blob);
    });
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error(`cannot decode ${blob.type}`));
      img.src = dataUrl;
    });
    const canvas = document.createElement('canvas');
    // Fit inside the page box at render scale.
    const scale = Math.min(1, (maxW * PT_TO_PX) / img.naturalWidth, (maxH * PT_TO_PX) / img.naturalHeight);
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas unavailable');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const png = canvas.toDataURL('image/png');
    const embedded = await pdf.embedPng(await (await fetch(png)).arrayBuffer());
    const fit = Math.min(maxW / embedded.width, maxH / embedded.height);
    pdf.addPage([pw, ph]).drawImage(embedded, {
      x: options.margin,
      y: options.margin + (maxH - embedded.height * fit) / 2,
      width: embedded.width * fit,
      height: embedded.height * fit,
    });
  }
  return pdf;
}
