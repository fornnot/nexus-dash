import { JsonTool } from './tools/JsonTool';
import { ImageTool } from './tools/ImageTool';
import { TextTool } from './tools/TextTool';
import { PdfTool } from './tools/PdfTool';

export default function ToolsModule() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Tools</h1>
        <p className="mt-1 text-sm text-zinc-400">
          JSON, image, text and PDF — everything below runs client-side and keeps working offline.
        </p>
      </header>
      <JsonTool />
      <ImageTool />
      <TextTool />
      <PdfTool />
    </div>
  );
}
