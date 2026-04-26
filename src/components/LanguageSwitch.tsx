import { Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSwitch({ variant = 'soft' }: { variant?: 'soft' | 'ghost' | 'light' }) {
  const { locale, toggleLocale } = useLanguage();
  const base =
    variant === 'light'
      ? 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
      : variant === 'ghost'
      ? 'bg-transparent text-slate-700 hover:bg-slate-100'
      : 'bg-white text-brand-700 border border-brand-200 hover:bg-brand-50';
  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${base}`}
      aria-label="Toggle language"
    >
      <Languages size={16} />
      <span>{locale === 'ar' ? 'EN' : 'العربية'}</span>
    </button>
  );
}
