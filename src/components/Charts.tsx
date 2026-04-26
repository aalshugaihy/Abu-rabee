import { ReactNode } from 'react';

type Tone = 'green' | 'amber' | 'rose' | 'blue' | 'slate' | 'violet' | 'cyan';

const fills: Record<Tone, string> = {
  green: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  blue: '#3b82f6',
  slate: '#64748b',
  violet: '#8b5cf6',
  cyan: '#06b6d4',
};

export function tonePalette(tone: Tone): string {
  return fills[tone];
}

type Datum = {
  key: string;
  label: ReactNode;
  value: number;
  tone?: Tone;
};

export function BarChart({ data }: { data: Datum[] }) {
  if (data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        const fill = fills[d.tone ?? 'slate'];
        return (
          <div key={d.key}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="font-medium text-slate-700">{d.label}</span>
              <span className="text-slate-500 text-xs font-bold tabular-nums">{d.value}</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden" role="img" aria-label={`${d.value}`}>
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${pct}%`, backgroundColor: fill }}
              />
            </div>
          </div>
        );
      })}
      <div className="text-[11px] text-slate-400 text-end pt-1" aria-hidden>
        max: {max}
      </div>
    </div>
  );
}

export function DonutChart({
  data,
  size = 180,
  strokeWidth = 22,
  centerLabel,
  centerValue,
}: {
  data: Datum[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: ReactNode;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label="Distribution chart">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {total > 0 &&
            data.map((d) => {
              const length = (d.value / total) * circumference;
              const fill = fills[d.tone ?? 'slate'];
              const segment = (
                <circle
                  key={d.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={fill}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-cumulativeOffset}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              );
              cumulativeOffset += length;
              return segment;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-extrabold text-slate-900">{centerValue ?? total}</div>
          {centerLabel && <div className="text-[11px] text-slate-500 font-semibold mt-0.5">{centerLabel}</div>}
        </div>
      </div>

      <ul className="space-y-2 flex-1 min-w-0 w-full sm:w-auto">
        {data.map((d) => {
          const fill = fills[d.tone ?? 'slate'];
          const pct = total === 0 ? 0 : Math.round((d.value / total) * 100);
          return (
            <li key={d.key} className="flex items-center gap-3 text-sm">
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: fill }} aria-hidden />
              <span className="flex-1 min-w-0 truncate text-slate-700">{d.label}</span>
              <span className="text-xs text-slate-500 tabular-nums">{pct}%</span>
              <span className="text-sm font-bold text-slate-800 tabular-nums w-7 text-end">{d.value}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
