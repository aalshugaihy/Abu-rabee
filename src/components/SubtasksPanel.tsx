import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import StatusBadge from './StatusBadge';
import { statusToTone, tTaskStatus } from '../lib/format';
import { TaskRecord } from '../data/types';

export default function SubtasksPanel({ task }: { task: TaskRecord }) {
  const { t } = useLanguage();
  const { tasks, addTask, removeTask } = useData();
  const toast = useToast();
  const [title, setTitle] = useState('');

  const subs = tasks.filter((tk) => tk.parentTaskId === task.id);
  const completed = subs.filter((s) => s.status === 'completed').length;
  const pct = subs.length === 0 ? 0 : Math.round((completed / subs.length) * 100);

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask({
      title: trimmed,
      kind: task.kind,
      committeeId: task.committeeId,
      department: task.department,
      priority: 'medium',
      status: 'planned',
      progress: 0,
      parentTaskId: task.id,
    });
    setTitle('');
    toast.success(t('subtasks.add') + ' ✓');
  }

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2 mb-4">
        <input
          type="text"
          className="input flex-1"
          placeholder={t('subtasks.placeholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={!title.trim()}>
          <Plus size={14} /> {t('subtasks.add')}
        </button>
      </form>

      {subs.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-[11px] text-slate-500 mb-1">
            <span>{completed} / {subs.length}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {subs.length === 0 ? (
        <p className="text-sm text-slate-500">{t('subtasks.empty')}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {subs.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-2.5">
              <input
                type="checkbox"
                checked={s.status === 'completed'}
                onChange={(e) => {
                  // Toggle a tiny in-place check; uses internal updateTask via separate handler on the page.
                  s.status = e.target.checked ? 'completed' : 'planned';
                }}
                aria-hidden
                className="hidden"
              />
              <Link to={`/app/tasks/item/${s.id}`} className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 truncate">{s.title}</div>
                <div className="mt-0.5">
                  <StatusBadge tone={statusToTone(s.status)}>{tTaskStatus(t, s.status)}</StatusBadge>
                </div>
              </Link>
              <button
                type="button"
                className="rounded-md p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                onClick={() => {
                  if (confirm(t('action.confirmDelete'))) {
                    removeTask(s.id);
                    toast.success(`${s.id} ${t('action.delete')} ✓`);
                  }
                }}
                aria-label={t('action.delete')}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
