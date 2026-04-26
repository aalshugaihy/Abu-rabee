import { DragEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, UsersRound } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { TaskRecord, TaskStatus } from '../data/types';
import { priorityToTone, statusToTone, tTaskPriority, tTaskStatus } from '../lib/format';

const COLUMNS: TaskStatus[] = ['planned', 'inProgress', 'onHold', 'completed', 'overdue'];

export default function TasksBoard() {
  const { t } = useLanguage();
  const { tasks, updateTask } = useData();
  const toast = useToast();
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, TaskRecord[]>();
    for (const s of COLUMNS) map.set(s, []);
    for (const task of tasks) {
      if (!map.has(task.status)) map.set(task.status, []);
      map.get(task.status)!.push(task);
    }
    return map;
  }, [tasks]);

  function onDragStart(e: DragEvent<HTMLDivElement>, taskId: string) {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDrop(e: DragEvent<HTMLDivElement>, status: TaskStatus) {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData('text/plain');
    const task = tasks.find((x) => x.id === id);
    if (!task || task.status === status) return;
    updateTask(id, { status });
    toast.success(`${id} → ${tTaskStatus(t, status)} ✓`);
  }

  return (
    <div>
      <PageHeader title={t('tasks.tab.board')} subtitle={t('tasks.board.intro')} />
      <div className="grid grid-flow-col auto-cols-[minmax(260px,1fr)] gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((status) => {
          const items = grouped.get(status) ?? [];
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(status);
              }}
              onDragLeave={() => setDragOver((s) => (s === status ? null : s))}
              onDrop={(e) => onDrop(e, status)}
              className={`rounded-2xl border-2 ${
                dragOver === status ? 'border-brand-500 bg-brand-50/50' : 'border-dashed border-slate-200 bg-white/60'
              } p-3 min-h-[400px] transition`}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <StatusBadge tone={statusToTone(status)}>{tTaskStatus(t, status)}</StatusBadge>
                </div>
                <span className="text-xs font-bold text-slate-500 tabular-nums">{items.length}</span>
              </div>
              <ul className="space-y-2">
                {items.map((task) => (
                  <li key={task.id}>
                    <div
                      draggable
                      onDragStart={(e) => onDragStart(e, task.id)}
                      className="card p-3 cursor-grab active:cursor-grabbing hover:shadow-card transition"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`badge ${task.kind === 'routine' ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700'}`}>
                          {task.kind === 'routine' ? <><Wrench size={11} /> {t('tasks.kind.routine')}</> : <><UsersRound size={11} /> {t('tasks.kind.team')}</>}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 ms-auto">{task.id}</span>
                      </div>
                      <Link
                        to={`/app/tasks/item/${task.id}`}
                        className="block font-semibold text-slate-800 leading-snug hover:text-brand-700"
                      >
                        {task.title}
                      </Link>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                        <StatusBadge tone={priorityToTone(task.priority)}>{tTaskPriority(t, task.priority)}</StatusBadge>
                        {task.dueDate && <span>{task.dueDate}</span>}
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${task.kind === 'routine' ? 'bg-amber-500' : 'bg-brand-500'}`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="text-center text-xs text-slate-400 py-8">{t('common.empty')}</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
