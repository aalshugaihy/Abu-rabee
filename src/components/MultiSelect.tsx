import { Check, ChevronDown, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

type Option<V extends string> = { value: V; label: string };

export default function MultiSelect<V extends string>({
  options,
  value,
  onChange,
  placeholder,
  allLabel,
}: {
  options: Option<V>[];
  value: V[];
  onChange: (next: V[]) => void;
  placeholder: string;
  allLabel?: string;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function toggle(v: V) {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  }

  const selected = options.filter((o) => value.includes(o.value));
  const isAll = selected.length === 0 || selected.length === options.length;
  const summary = isAll
    ? allLabel ?? t('filter.statusAll')
    : selected.length === 1
    ? selected[0].label
    : `${selected.length} ${t('filter.statusN')}`;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="select w-full text-start flex items-center justify-between gap-2"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={placeholder}
      >
        <span className="truncate text-slate-700">{summary}</span>
        <ChevronDown size={14} className={`text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 top-full inset-x-0 mt-1 rounded-xl border border-slate-200 bg-white shadow-card p-1.5 max-h-72 overflow-y-auto">
          {options.map((o) => {
            const checked = value.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className={`w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
                  checked ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{o.label}</span>
                {checked && <Check size={14} />}
              </button>
            );
          })}
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              <X size={12} /> {t('bulk.clear')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
