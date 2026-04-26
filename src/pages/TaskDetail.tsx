import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Trash2, Wrench, UsersRound } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import StatusBadge from '../components/StatusBadge';
import ActivityFeed from '../components/ActivityFeed';
import CommentsThread from '../components/CommentsThread';
import SubtasksPanel from '../components/SubtasksPanel';
import DependenciesPanel from '../components/DependenciesPanel';
import {
  committeeName,
  priorityToTone,
  statusToTone,
  tDept,
  tTaskFrequency,
  tTaskPriority,
  tTaskStatus,
} from '../lib/format';
import { formatDateTime } from '../lib/datetime';

export default function TaskDetail() {
  const { id } = useParams();
  const { t, dir, locale } = useLanguage();
  const { tasks, committees, activity, updateTask, removeTask } = useData();
  const navigate = useNavigate();
  const toast = useToast();
  const Arrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const task = tasks.find((x) => x.id === id);

  if (!task) {
    return (
      <div className="card p-10 text-center">
        <h2 className="text-lg font-bold text-slate-900">{t('common.empty')}</h2>
        <Link to="/app/tasks" className="btn-primary mt-4">{t('detail.back')}</Link>
      </div>
    );
  }

  const committee = task.committeeId ? committees.find((c) => c.id === task.committeeId) : undefined;
  const logs = activity.filter((a) => a.entity === 'task' && a.entityId === task.id);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Link to="/app/tasks" className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-semibold">
          <Arrow size={14} /> {t('detail.back')}
        </Link>
      </div>

      <div className="card p-6 mb-6 relative overflow-hidden">
        <div className={`absolute inset-x-0 top-0 h-1 ${task.kind === 'routine' ? 'bg-amber-500' : 'bg-brand-600'}`} />
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`badge ${task.kind === 'routine' ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700'}`}>
                {task.kind === 'routine' ? <><Wrench size={12} /> {t('tasks.kind.routine')}</> : <><UsersRound size={12} /> {t('tasks.kind.team')}</>}
              </span>
              <span className="font-mono text-[11px] text-slate-500">{task.id}</span>
              <StatusBadge tone={statusToTone(task.status)}>{tTaskStatus(t, task.status)}</StatusBadge>
              <StatusBadge tone={priorityToTone(task.priority)}>{tTaskPriority(t, task.priority)}</StatusBadge>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">{task.title}</h1>
            {task.description && <p className="mt-1 text-sm text-slate-600 leading-relaxed">{task.description}</p>}
          </div>
          <button
            type="button"
            className="btn-ghost text-rose-600 hover:bg-rose-50"
            onClick={() => {
              if (confirm(t('action.confirmDelete'))) {
                removeTask(task.id);
                toast.success(`${task.id} ${t('action.delete')} ✓`);
                navigate('/app/tasks');
              }
            }}
          >
            <Trash2 size={14} /> {t('action.delete')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">{t('detail.overview')}</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <F label={t('tasks.field.team')} value={task.team ?? (committee ? committeeName(committee, locale) : undefined)} />
              <F label={t('tasks.field.assignee')} value={task.assignee} />
              <F label={t('committees.field.department')} value={tDept(t, task.department)} />
              <F label={t('tasks.field.frequency')} value={task.frequency ? tTaskFrequency(t, task.frequency) : undefined} />
              <F label={t('tasks.field.dueDate')} value={task.dueDate} />
              <F label={t('tasks.field.lastRun')} value={task.lastRun} />
              <F label={t('tasks.field.nextRun')} value={task.nextRun} />
              <F label={t('detail.createdAt')} value={formatDateTime(task.createdAt)} />
              <F label={t('detail.updatedAt')} value={formatDateTime(task.updatedAt)} />
            </dl>
            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{t('tasks.field.progress')}</span>
                <span>{task.progress}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={task.progress}
                onChange={(e) => updateTask(task.id, { progress: Number(e.target.value) })}
                className="w-full accent-brand-600"
              />
            </div>
          </div>

          {committee && (
            <div className="card p-6">
              <h2 className="text-base font-bold text-slate-900 mb-3">{t('committees.title')}</h2>
              <Link to={`/app/committees/${committee.id}`} className="block rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
                <span className="font-mono text-[10px] text-slate-400">{committee.id}</span>
                <div className="font-semibold text-slate-800">{committeeName(committee, locale)}</div>
                {committee.organizer && <div className="text-xs text-slate-500 mt-0.5">{committee.organizer}</div>}
              </Link>
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">{t('subtasks.title')}</h2>
            <SubtasksPanel task={task} />
          </div>

          <div className="card p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">{t('deps.title')}</h2>
            <DependenciesPanel taskId={task.id} />
          </div>

          <div className="card p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">{t('detail.comments')}</h2>
            <CommentsThread entity="task" entityId={task.id} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">{t('detail.activity')}</h2>
          <ActivityFeed logs={logs} />
        </div>
      </div>
    </div>
  );
}

function F({ label, value }: { label: string | undefined; value: string | number | undefined }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-800 font-medium">{value === undefined || value === '' ? '—' : value}</dd>
    </div>
  );
}
