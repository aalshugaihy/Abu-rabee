import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, ArrowLeftRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import StatusBadge from './StatusBadge';
import { statusToTone, tTaskStatus } from '../lib/format';

export default function DependenciesPanel({ taskId }: { taskId: string }) {
  const { t } = useLanguage();
  const { tasks, dependencies, addDependency, removeDependency } = useData();
  const toast = useToast();
  const [pick, setPick] = useState<string>('');

  const myDeps = dependencies.filter((d) => d.taskId === taskId);
  const candidates = tasks.filter(
    (tk) => tk.id !== taskId && !myDeps.some((d) => d.dependsOnId === tk.id)
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!pick) return;
    const result = addDependency(taskId, pick);
    if (!result.ok) {
      const msg = result.reason === 'cycle' ? t('deps.cycle') : result.reason === 'self' ? t('deps.self') : t('deps.duplicate');
      toast.error(msg);
      return;
    }
    setPick('');
    toast.success(t('deps.add') + ' ✓');
  }

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2 mb-4">
        <select
          className="select flex-1"
          value={pick}
          onChange={(e) => setPick(e.target.value)}
          aria-label={t('deps.pickTask')}
        >
          <option value="">{t('deps.pickTask')}</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id} — {c.title}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary" disabled={!pick}>
          <Plus size={14} /> {t('deps.add')}
        </button>
      </form>

      {myDeps.length === 0 ? (
        <p className="text-sm text-slate-500">{t('deps.empty')}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {myDeps.map((d) => {
            const blocker = tasks.find((x) => x.id === d.dependsOnId);
            return (
              <li key={d.id} className="flex items-center gap-3 py-2.5">
                <ArrowLeftRight size={14} className="text-slate-400 shrink-0" />
                <Link to={blocker ? `/app/tasks/item/${blocker.id}` : '#'} className="flex-1 min-w-0">
                  <div className="font-mono text-[10px] text-slate-400">{d.dependsOnId}</div>
                  <div className="font-semibold text-slate-800 truncate">{blocker?.title ?? '—'}</div>
                  {blocker && (
                    <div className="mt-0.5">
                      <StatusBadge tone={statusToTone(blocker.status)}>{tTaskStatus(t, blocker.status)}</StatusBadge>
                    </div>
                  )}
                </Link>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  onClick={() => removeDependency(d.id)}
                  aria-label={t('action.delete')}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
