import { ChangeEvent, useRef } from 'react';
import { Upload } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { parseCsv } from '../lib/csv';

type Props<T> = {
  /**
   * Map a parsed row (header → cell) to the entity, or return null to skip.
   * The mapper is expected to handle missing/extra columns gracefully.
   */
  mapRow: (row: Record<string, string>, index: number) => T | null;
  onImport: (rows: T[]) => void;
  label?: string;
};

export default function CsvImportButton<T>({ mapRow, onImport, label }: Props<T>) {
  const { t } = useLanguage();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    inputRef.current?.click();
  }

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const mapped: T[] = [];
      rows.forEach((row, idx) => {
        const item = mapRow(row, idx);
        if (item) mapped.push(item);
      });
      if (mapped.length === 0) {
        toast.error(t('import.empty'));
        return;
      }
      onImport(mapped);
      toast.success(`${t('action.import')}: ${mapped.length} ✓`);
    } catch (err) {
      console.error(err);
      toast.error(t('import.failed'));
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleChange}
        className="hidden"
        aria-hidden
      />
      <button type="button" className="btn-ghost" onClick={handleClick}>
        <Upload size={16} />
        {label ?? t('action.import')}
      </button>
    </>
  );
}
