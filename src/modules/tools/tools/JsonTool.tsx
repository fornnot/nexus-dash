import { useState } from 'react';
import { Badge, Button } from '@/core/primitives';
import { Icon } from '@/core/icons';

type Mode = 'pretty' | 'minify';

export function JsonTool() {
  const [input, setInput] = useState('{"app":"nexus","offline":true,"tags":["fx","utils"]}');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const run = (m: Mode) => {
    try {
      const parsed: unknown = JSON.parse(input);
      setOutput(m === 'pretty' ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
      setOutput('');
    }
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Icon.file className="size-4 text-violet-300" /> JSON Formatter
        </h3>
        <Badge tone="violet">100% offline</Badge>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        spellCheck={false}
        rows={6}
        className="mt-3 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-200 outline-none focus:border-violet-500/50"
        placeholder="Paste JSON here…"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="primary" onClick={() => run('pretty')}>
          Format
        </Button>
        <Button size="sm" onClick={() => run('minify')}>
          Minify
        </Button>
        {error ? (
          <span className="text-xs text-red-400">⚠ {error}</span>
        ) : output ? (
          <span className="text-xs text-emerald-400">✓ valid JSON</span>
        ) : null}
        <span className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={copy} disabled={!output}>
            {copied ? <Icon.check className="size-3.5" /> : <Icon.copy className="size-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button size="sm" variant="ghost" onClick={download} disabled={!output}>
            <Icon.download className="size-3.5" /> Save
          </Button>
        </span>
      </div>

      {output && (
        <textarea
          readOnly
          value={output}
          rows={8}
          className="mt-3 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-cyan-200 outline-none"
        />
      )}
    </div>
  );
}
