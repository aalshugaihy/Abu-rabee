import { useEffect, useState } from 'react';
import { Bookmark, ChevronDown, Trash2, Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';

export type SavedView<F = Record<string, unknown>> = {
  id: string;
  page: string;
  name: string;
  filters: F;
};

type RemoteView = {
  id: string;
  page: string;
  name: string;
  filters: string;
};

const LOCAL_PREFIX = 'abu-rabee.views.';

function loadLocal<F>(page: string): SavedView<F>[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_PREFIX + page) || '[]');
  } catch {
    return [];
  }
}
function saveLocal<F>(page: string, items: SavedView<F>[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_PREFIX + page, JSON.stringify(items));
}

/**
 * Saved filter presets. In API mode they live on the server (and are scoped
 * per-user). Offline they're cached in localStorage so each browser keeps
 * its own list.
 */
export default function SavedViews<F extends Record<string, unknown>>({
  page,
  current,
  onApply,
}: {
  page: string;
  current: F;
  onApply: (filters: F) => void;
}) {
  const { t } = useLanguage();
  const { apiAvailable, user } = useAuth();
  const toast = useToast();
  const remoteMode = apiAvailable && !!user;

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [items, setItems] = useState<SavedView<F>[]>(() => (remoteMode ? [] : loadLocal<F>(page)));

  useEffect(() => {
    if (!remoteMode) {
      setItems(loadLocal<F>(page));
      return;
    }
    api
      .get<RemoteView[]>(`/api/views?page=${encodeURIComponent(page)}`)
      .then((rows) =>
        setItems(
          rows.map((r) => ({
            id: r.id,
            page: r.page,
            name: r.name,
            filters: safeParse<F>(r.filters),
          }))
        )
      )
      .catch(() => setItems([]));
  }, [page, remoteMode]);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (remoteMode) {
      try {
        const created = await api.post<RemoteView>('/api/views', { page, name: trimmed, filters: current });
        setItems((prev) => [
          { id: created.id, page: created.page, name: created.name, filters: safeParse<F>(created.filters) },
          ...prev,
        ]);
      } catch {
        toast.error('!');
        return;
      }
    } else {
      const id = `LV-${Date.now()}`;
      const next = [{ id, page, name: trimmed, filters: current }, ...items];
      setItems(next);
      saveLocal(page, next);
    }
    setName('');
    toast.success(t('action.save') + ' ✓');
  }

  async function remove(id: string) {
    if (remoteMode) {
      await api.del(`/api/views/${id}`).catch(() => null);
    }
    const next = items.filter((it) => it.id !== id);
    setItems(next);
    if (!remoteMode) saveLocal(page, next);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Bookmark size={14} /> {t('views.title')}
        <ChevronDown size={12} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 top-full mt-2 end-0 w-80 rounded-2xl border border-slate-200 bg-white shadow-card p-3 animate-slide-up">
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="input flex-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('views.namePlaceholder')}
            />
            <button type="button" className="btn-primary" onClick={save} disabled={!name.trim()}>
              <Save size={14} /> {t('views.save')}
            </button>
          </div>
          {items.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500 text-center py-4">{t('views.empty')}</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {items.map((v) => (
                <li key={v.id} className="flex items-center gap-2 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      onApply(v.filters);
                      setOpen(false);
                    }}
                    className="flex-1 text-start text-sm font-semibold text-slate-800 hover:text-brand-700 truncate"
                  >
                    {v.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(v.id)}
                    className="rounded-md p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    aria-label={t('action.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function safeParse<T>(s: string): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return {} as T;
  }
}
