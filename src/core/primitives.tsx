import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './utils';

/* --------------------------------- Button --------------------------------- */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'subtle';
  size?: 'sm' | 'md';
}

export function Button({ variant = 'subtle', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400/70 disabled:opacity-50',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm',
        variant === 'primary' && 'bg-cyan-500 text-zinc-950 hover:bg-cyan-400',
        variant === 'ghost' && 'text-zinc-300 hover:bg-zinc-800/70 hover:text-zinc-100',
        variant === 'subtle' && 'border border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800',
        className,
      )}
      {...rest}
    />
  );
}

/* ---------------------------------- Card ---------------------------------- */

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* --------------------------------- Badge ---------------------------------- */

const badgeTones = {
  neutral: 'bg-zinc-800 text-zinc-300',
  cyan: 'bg-cyan-500/15 text-cyan-300',
  violet: 'bg-violet-500/15 text-violet-300',
  green: 'bg-emerald-500/15 text-emerald-300',
  amber: 'bg-amber-500/15 text-amber-300',
  red: 'bg-red-500/15 text-red-300',
} as const;

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', badgeTones[tone], className)}>
      {children}
    </span>
  );
}

/* -------------------------------- Section --------------------------------- */

export function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

/* -------------------------------- Spinner --------------------------------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-block size-4 animate-spin rounded-full border-2 border-zinc-600 border-t-cyan-400',
        className,
      )}
    />
  );
}

/* ------------------------------ Offline chip ------------------------------ */

export function StaleChip({ label = 'cached' }: { label?: string }) {
  return (
    <Badge tone="amber">
      <span className="size-1.5 rounded-full bg-amber-400" />
      {label}
    </Badge>
  );
}
