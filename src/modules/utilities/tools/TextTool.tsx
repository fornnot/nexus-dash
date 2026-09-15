import { useMemo, useState } from 'react';
import { Badge, Button } from '@/core/primitives';
import { Icon } from '@/core/icons';

const transforms: Array<{ label: string; fn: (t: string) => string }> = [
  { label: 'UPPER', fn: (t) => t.toUpperCase() },
  { label: 'lower', fn: (t) => t.toLowerCase() },
  {
    label: 'Title',
    fn: (t) => t.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()),
  },
  { label: 'Sentence', fn: (t) => t.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase()) },
  { label: 'camelCase', fn: (t) => t.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, c: string) => c.toUpperCase()) },
  {
    label: 'snake_case',
    fn: (t) =>
      t
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, ''),
  },
  { label: 'kebab-case', fn: (t) => t.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') },
  { label: 'Sort A→Z', fn: (t) => t.split('\n').sort((a, b) => a.localeCompare(b)).join('\n') },
  { label: 'Dedupe', fn: (t) => Array.from(new Set(t.split('\n'))).join('\n') },
  { label: 'Trim lines', fn: (t) => t.split('\n').map((l) => l.trim()).join('\n') },
  { label: 'Reverse', fn: (t) => t.split('').reverse().join('') },
];

export function TextTool() {
  const [text, setText] = useState('The quick brown fox\njumps over\nthe lazy dog');
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return {
      chars: text.length,
      words,
      lines: text ? text.split('\n').length : 0,
    };
  }, [text]);

  const apply = (fn: (t: string) => string) => setText((t) => fn(t));

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Icon.text className="size-4 text-violet-300" /> Text Formatter
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

      <div className="mt-2 flex flex-wrap gap-1.5">
        {transforms.map((t) => (
          <Button key={t.label} size="sm" onClick={() => apply(t.fn)}>
            {t.label}
          </Button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
        <span>{stats.chars} chars</span>
        <span>{stats.words} words</span>
        <span>{stats.lines} lines</span>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={copy}>
          {copied ? <Icon.check className="size-3.5" /> : <Icon.copy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}
