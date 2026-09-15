import { JsonTool } from './tools/JsonTool';
import { ImageTool } from './tools/ImageTool';
import { TextTool } from './tools/TextTool';
import { PdfTool } from './tools/PdfTool';

export default function UtilitiesModule() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Offline Utilities</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Everything below runs client-side — it keeps working with the network off.
        </p>
      </header>
      <JsonTool />
      <ImageTool />
      <TextTool />
      <PdfTool />
    </div>
  );
}
