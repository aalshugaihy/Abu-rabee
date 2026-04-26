import { ReactNode } from 'react';

type Tone = 'green' | 'amber' | 'rose' | 'blue' | 'slate' | 'violet' | 'cyan';

const tones: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  rose: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
  blue: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100',
  slate: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  violet: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
  cyan: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100',
};

export default function StatusBadge({ tone = 'slate', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {children}
    </span>
  );
}
