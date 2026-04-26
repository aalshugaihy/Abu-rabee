import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Search, Trash2, Pencil, Wrench, UsersRound, ListChecks } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import {
  TaskRecord,
  TaskKind,
  TaskStatus,
  TaskPriority,
  TaskFrequency,
  DepartmentKey,
} from '../data/types';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import {
  priorityToTone,
  statusToTone,
  tDept,
  tTaskFrequency,
  tTaskPriority,
  tTaskStatus,
} from '../lib/format';

const STATUSES: TaskStatus[] = ['planned', 'inProgress', 'completed', 'overdue', 'onHold'];
const PRIORITIES: TaskPriority[] = ['high', 'medium', 'low'];
const FREQS: TaskFrequency[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
const DEPTS: DepartmentKey[] = ['marine', 'geodesy', 'land', 'remoteSensing', 'services'];

type Tab = 'all' | 'routine' | 'teams';
type FormState = Partial<TaskRecord>;

export default function TasksPage() {
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const { tab: tabParam } = useParams();
  const initialTab: Tab =
    tabParam === 'routine' ? 'routine' : tabParam === 'teams' ? 'teams' : 'all';

  const { tasks, committees, addTask, updateTask, removeTask } = useData();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [editing, setEditing] = useState<TaskRecord | null>(null);
  const [creating, setCreating] = useState<TaskKind | null>(null);

  useEffect(() => {
    setTab(tabParam === 'routine' ? 'routine' : tabParam === 'teams' ? 'teams' : 'all');
  }, [tabParam]);

  const visible = useMemo(() => {
    return tasks.filter((task) => {
      if (tab === 'routine' && task.kind !== 'routine') return false;
      if (tab === 'teams' && task.kind !== 'team') return false;
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const blob = `${task.title} ${task.team ?? ''} ${task.assignee ?? ''}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, tab, statusFilter, query]);

  const tabs: Array<{ key: Tab; label: string; icon: typeof ListChecks }> = [
    { key: 'all', label: t('tasks.title'), icon: ListChecks },
    { key: 'routine', label: t('tasks.tab.routine'), icon: Wrench },
    { key: 'teams', label: t('tasks.tab.teams'), icon: UsersRound },
  ];

  function changeTab(next: Tab) {
    setTab(next);
    if (next === 'all') navigate('/app/tasks');
    else navigate(`/app/tasks/${next}`);
  }

  const intro =
    tab === 'routine' ? t('tasks.routine.intro') : tab === 'teams' ? t('tasks.teams.intro') : t('tasks.subtitle');

  return (
    <div>
      <PageHeader
        title={t('tasks.title')}
        subtitle={intro}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-secondary" onClick={() => setCreating('routine')}>
              <Plus size={16} /> {t('tasks.kind.routine')}
            </button>
            <button type="button" className="btn-primary" onClick={() => setCreating('team')}>
              <Plus size={16} /> {t('tasks.kind.team')}
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="card p-1.5 mb-5 inline-flex flex-wrap">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => changeTab(key)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === key ? 'bg-brand-600 text-white shadow-soft' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="card p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('action.search')}
              className="input ps-10"
            />
          </div>
          <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as never)}>
            <option value="all">{t('common.all')} — {t('tasks.field.status')}</option>
            {STATUSES.map((s) => (<option key={s} value={s}>{tTaskStatus(t, s)}</option>))}
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card"><EmptyState title={t('common.empty')} /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map((task) => {
            const c = task.committeeId ? committees.find((x) => x.id === task.committeeId) : undefined;
            return (
              <div key={task.id} className="card p-5 relative overflow-hidden">
                <div
                  className={`absolute inset-y-0 start-0 w-1 ${
                    task.kind === 'routine' ? 'bg-amber-500' : 'bg-brand-600'
                  }`}
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`badge ${task.kind === 'routine' ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700'}`}>
                        {task.kind === 'routine' ? <><Wrench size={12} /> {t('tasks.kind.routine')}</> : <><UsersRound size={12} /> {t('tasks.kind.team')}</>}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">{task.id}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
                    {task.description && <p className="mt-1 text-sm text-slate-600 line-clamp-2">{task.description}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusBadge tone={statusToTone(task.status)}>{tTaskStatus(t, task.status)}</StatusBadge>
                    <StatusBadge tone={priorityToTone(task.priority)}>{tTaskPriority(t, task.priority)}</StatusBadge>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-slate-500">{t('tasks.field.team')}</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{task.team ?? c?.name ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">{task.kind === 'routine' ? t('tasks.field.frequency') : t('tasks.field.assignee')}</div>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {task.kind === 'routine' ? (task.frequency ? tTaskFrequency(t, task.frequency) : '—') : (task.assignee ?? '—')}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">{t('committees.field.department')}</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{tDept(t, task.department)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">{task.kind === 'routine' ? t('tasks.field.nextRun') : t('tasks.field.dueDate')}</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{(task.kind === 'routine' ? task.nextRun : task.dueDate) ?? '—'}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>{t('tasks.field.progress')}</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${task.kind === 'routine' ? 'bg-amber-500' : 'bg-brand-600'}`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-1.5">
                  <button type="button" className="btn-ghost px-2.5 py-1.5" onClick={() => setEditing(task)}>
                    <Pencil size={14} /> {t('action.edit')}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-2.5 py-1.5 text-rose-600 hover:bg-rose-50"
                    onClick={() => { if (confirm(t('action.confirmDelete'))) removeTask(task.id); }}
                  >
                    <Trash2 size={14} /> {t('action.delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(creating || editing) && (
        <TaskForm
          initial={editing ?? undefined}
          defaultKind={creating ?? 'team'}
          locale={locale}
          onClose={() => { setCreating(null); setEditing(null); }}
          onSubmit={(data) => {
            if (editing) updateTask(editing.id, data);
            else
              addTask({
                title: data.title ?? '',
                kind: data.kind ?? 'team',
                priority: data.priority ?? 'medium',
                status: data.status ?? 'planned',
                progress: data.progress ?? 0,
                ...data,
              } as TaskRecord);
            setCreating(null); setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function TaskForm({
  initial,
  defaultKind,
  locale,
  onClose,
  onSubmit,
}: {
  initial?: TaskRecord;
  defaultKind: TaskKind;
  locale: 'ar' | 'en';
  onClose: () => void;
  onSubmit: (data: FormState) => void;
}) {
  const { t } = useLanguage();
  const { committees } = useData();
  const [form, setForm] = useState<FormState>(
    initial ?? {
      title: '',
      kind: defaultKind,
      priority: 'medium',
      status: 'planned',
      progress: 0,
    }
  );
  const set = <K extends keyof TaskRecord>(key: K, value: TaskRecord[K] | undefined) =>
    setForm((p) => ({ ...p, [key]: value }));

  const isRoutine = form.kind === 'routine';

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? t('action.edit') : `${t('action.addNew')} — ${form.kind === 'routine' ? t('tasks.kind.routine') : t('tasks.kind.team')}`}
      size="lg"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>{t('action.cancel')}</button>
          <button className="btn-primary" onClick={() => onSubmit(form)} disabled={!form.title}>{t('action.save')}</button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="label">{t('tasks.field.title')} *</label>
          <input className="input" value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="label">{t('tasks.field.description')}</label>
          <textarea className="textarea" rows={3} value={form.description ?? ''} onChange={(e) => set('description', e.target.value || undefined)} />
        </div>
        <div>
          <label className="label">{t('tasks.field.kind')}</label>
          <select className="select" value={form.kind} onChange={(e) => set('kind', e.target.value as TaskKind)}>
            <option value="routine">{t('tasks.kind.routine')}</option>
            <option value="team">{t('tasks.kind.team')}</option>
          </select>
        </div>
        <div>
          <label className="label">{t('tasks.field.team')}</label>
          <select className="select" value={form.committeeId ?? ''} onChange={(e) => set('committeeId', e.target.value || undefined)}>
            <option value="">—</option>
            {committees.map((c) => (
              <option key={c.id} value={c.id}>
                {locale === 'en' && c.nameEn ? c.nameEn : c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t('tasks.field.assignee')}</label>
          <input className="input" value={form.assignee ?? ''} onChange={(e) => set('assignee', e.target.value || undefined)} />
        </div>
        <div>
          <label className="label">{t('tasks.field.priority')}</label>
          <select className="select" value={form.priority} onChange={(e) => set('priority', e.target.value as TaskPriority)}>
            {PRIORITIES.map((s) => (<option key={s} value={s}>{tTaskPriority(t, s)}</option>))}
          </select>
        </div>
        <div>
          <label className="label">{t('tasks.field.status')}</label>
          <select className="select" value={form.status} onChange={(e) => set('status', e.target.value as TaskStatus)}>
            {STATUSES.map((s) => (<option key={s} value={s}>{tTaskStatus(t, s)}</option>))}
          </select>
        </div>
        <div>
          <label className="label">{t('committees.field.department')}</label>
          <select className="select" value={form.department ?? ''} onChange={(e) => set('department', (e.target.value || undefined) as DepartmentKey | undefined)}>
            <option value="">—</option>
            {DEPTS.map((d) => (<option key={d} value={d}>{tDept(t, d)}</option>))}
          </select>
        </div>
        {isRoutine && (
          <div>
            <label className="label">{t('tasks.field.frequency')}</label>
            <select className="select" value={form.frequency ?? ''} onChange={(e) => set('frequency', (e.target.value || undefined) as TaskFrequency | undefined)}>
              <option value="">—</option>
              {FREQS.map((f) => (<option key={f} value={f}>{tTaskFrequency(t, f)}</option>))}
            </select>
          </div>
        )}
        <div>
          <label className="label">{t('tasks.field.dueDate')}</label>
          <input type="date" className="input" value={form.dueDate ?? ''} onChange={(e) => set('dueDate', e.target.value || undefined)} />
        </div>
        {isRoutine && (
          <>
            <div>
              <label className="label">{t('tasks.field.lastRun')}</label>
              <input type="date" className="input" value={form.lastRun ?? ''} onChange={(e) => set('lastRun', e.target.value || undefined)} />
            </div>
            <div>
              <label className="label">{t('tasks.field.nextRun')}</label>
              <input type="date" className="input" value={form.nextRun ?? ''} onChange={(e) => set('nextRun', e.target.value || undefined)} />
            </div>
          </>
        )}
        <div className="md:col-span-2">
          <label className="label">{t('tasks.field.progress')} ({form.progress ?? 0}%)</label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={form.progress ?? 0}
            onChange={(e) => set('progress', Number(e.target.value))}
            className="w-full accent-brand-600"
          />
        </div>
      </div>
    </Modal>
  );
}
