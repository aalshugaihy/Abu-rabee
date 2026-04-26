import { FormEvent, useState } from 'react';
import { Send, Trash2, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { ActivityEntity } from '../data/types';
import { formatDateTime } from '../lib/datetime';

const AUTHOR_KEY = 'abu-rabee.comment.author';

export default function CommentsThread({ entity, entityId }: { entity: ActivityEntity; entityId: string }) {
  const { t } = useLanguage();
  const { comments, addComment, removeComment } = useData();
  const toast = useToast();
  const stored = typeof window !== 'undefined' ? window.localStorage.getItem(AUTHOR_KEY) ?? '' : '';
  const [author, setAuthor] = useState(stored);
  const [text, setText] = useState('');

  const items = comments
    .filter((c) => c.entity === entity && c.entityId === entityId)
    .sort((a, b) => b.at.localeCompare(a.at));

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    const who = author.trim();
    if (!trimmed || !who) return;
    addComment({ entity, entityId, author: who, text: trimmed });
    if (typeof window !== 'undefined') window.localStorage.setItem(AUTHOR_KEY, who);
    setText('');
    toast.success(t('comments.add') + ' ✓');
  }

  return (
    <div>
      <form onSubmit={submit} className="space-y-2 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            className="input sm:col-span-1"
            placeholder={t('comments.author')}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            aria-label={t('comments.author')}
          />
          <input
            type="text"
            className="input sm:col-span-2"
            placeholder={t('comments.placeholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label={t('comments.placeholder')}
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={!text.trim() || !author.trim()}>
            <Send size={14} /> {t('comments.add')}
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{t('comments.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id} className="rounded-2xl bg-slate-50/70 border border-slate-200 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-7 w-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                    <User size={14} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-800 truncate">{c.author}</div>
                    <div className="text-[11px] text-slate-500">{formatDateTime(c.at)}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeComment(c.id)}
                  className="rounded-md p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  aria-label={t('action.delete')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{c.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
