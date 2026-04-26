import { Trash2, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function BulkBar({
  count,
  onClear,
  onDelete,
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="mb-4 sticky top-[68px] z-20 flex items-center justify-between gap-3 rounded-2xl bg-brand-700 text-white px-4 py-3 shadow-card animate-slide-up">
      <span className="text-sm font-bold">
        {count} <span className="font-medium opacity-80">{t('bulk.selected')}</span>
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-bold"
        >
          <X size={14} /> {t('bulk.clear')}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 px-3 py-1.5 text-xs font-bold"
        >
          <Trash2 size={14} /> {t('bulk.deleteSelected')}
        </button>
      </div>
    </div>
  );
}
