import { DragEvent, FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from './StatusBadge';
import { statusToTone, tTaskStatus } from '../lib/format';
import { TaskRecord } from '../data/types';
import { api } from '../lib/api';
import { apiAvailable } from '../lib/api';

export default function SubtasksPanel({ task }: { task: TaskRecord }) {
  const { t } = useLanguage();
  const { tasks, addTask, removeTask, updateTask } = useData();
  const toast = useToast();
  const { user } = useAuth();
  const remoteMode = apiAvailable && !!user;
  const [title, setTitle] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Show subs in their persisted order. Falls back to creation order when
  // orderIndex is missing (e.g. legacy local data).
  const subs = useMemo(() => {
    return tasks
      .filter((tk) => tk.parentTaskId === task.id)
      .slice()
      .sort((a, b) => {
        const ai = (a as TaskRecord & { orderIndex?: number }).orderIndex ?? 0;
        const bi = (b as TaskRecord & { orderIndex?: number }).orderIndex ?? 0;
        if (ai !== bi) return ai - bi;
        return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
      });
  }, [tasks, task.id]);

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

  function handleDragStart(e: DragEvent<HTMLLIElement>, id: string) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }

  function handleDrop(e: DragEvent<HTMLLIElement>, dropId: string) {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggingId;
    if (!sourceId || sourceId === dropId) return;
    const ids = subs.map((s) => s.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(dropId);
    if (from === -1 || to === -1) return;
    const reordered = [...ids];
    reordered.splice(from, 1);
    reordered.splice(to, 0, sourceId);
    // Optimistically push the new orderIndex onto each subtask.
    reordered.forEach((id, idx) => {
      updateTask(id, { orderIndex: idx } as Partial<TaskRecord> & { orderIndex: number });
    });
    if (remoteMode) {
      api.put(`/api/tasks/${task.id}/subtasks/order`, { ids: reordered }).catch(() => null);
    }
    setDraggingId(null);
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
            <li
              key={s.id}
              draggable
              onDragStart={(e) => handleDragStart(e, s.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, s.id)}
              onDragEnd={() => setDraggingId(null)}
              className={`flex items-center gap-2 py-2.5 transition ${
                draggingId === s.id ? 'opacity-50' : ''
              }`}
            >
              <span className="cursor-grab text-slate-300 hover:text-slate-600" aria-label="drag">
                <GripVertical size={14} />
              </span>
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
