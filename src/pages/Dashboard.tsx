import { Link } from 'react-router-dom';
import {
  Users,
  Inbox,
  ListChecks,
  Activity,
  AlertTriangle,
  Wrench,
  UsersRound,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import StatusBadge from '../components/StatusBadge';
import {
  committeeName,
  priorityToTone,
  statusToTone,
  tDept,
  tReqPriority,
  tReqStatus,
} from '../lib/format';

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
    </div>
  );
}

export default function DashboardHome() {
  const { t, dir, locale } = useLanguage();
  const { committees, requests, tasks } = useData();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const activeCommittees = committees.filter((c) => c.status === 'active').length;
  const openRequests = requests.filter((r) => r.status === 'new' || r.status === 'inProgress').length;
  const overdueTasks = tasks.filter((t) => t.status === 'overdue').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'inProgress').length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const compliance = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

  const byDept = committees.reduce<Record<string, number>>((acc, c) => {
    if (!c.department) return acc;
    acc[c.department] = (acc[c.department] || 0) + 1;
    return acc;
  }, {});
  const deptMax = Math.max(1, ...Object.values(byDept));

  const byStatus = requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  const statusOrder: Array<'new' | 'inProgress' | 'completed' | 'late' | 'onTime' | 'followUp'> = ['new', 'inProgress', 'completed', 'late', 'onTime', 'followUp'];

  const upcomingTasks = [...tasks]
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 5);

  const recentRequests = [...requests]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 5);

  const kpis = [
    {
      icon: Users,
      label: t('dashboard.kpi.committees'),
      value: committees.length,
      sub: `${activeCommittees} ${t('dashboard.kpi.activeCommittees')}`,
      tone: 'from-brand-500 to-brand-700',
    },
    {
      icon: Inbox,
      label: t('dashboard.kpi.requests'),
      value: requests.length,
      sub: `${openRequests} ${t('dashboard.kpi.openRequests')}`,
      tone: 'from-sky-500 to-blue-700',
    },
    {
      icon: ListChecks,
      label: t('dashboard.kpi.tasks'),
      value: tasks.length,
      sub: `${inProgressTasks} ${t('tasks.status.inProgress')}`,
      tone: 'from-amber-500 to-orange-600',
    },
    {
      icon: AlertTriangle,
      label: t('dashboard.kpi.overdue'),
      value: overdueTasks,
      sub: `${t('dashboard.kpi.compliance')}: ${compliance}%`,
      tone: 'from-rose-500 to-red-600',
    },
  ];

  const services = [
    { to: '/app/committees', icon: Users, label: t('service.committees.title'), tone: 'text-brand-700 bg-brand-50' },
    { to: '/app/requests', icon: Inbox, label: t('service.requests.title'), tone: 'text-sky-700 bg-sky-50' },
    { to: '/app/tasks/routine', icon: Wrench, label: t('nav.tasks.routine'), tone: 'text-amber-700 bg-amber-50' },
    { to: '/app/tasks/teams', icon: UsersRound, label: t('nav.tasks.teams'), tone: 'text-violet-700 bg-violet-50' },
    { to: '/app/reports', icon: BarChart3, label: t('service.reports.title'), tone: 'text-emerald-700 bg-emerald-50' },
  ];

  return (
    <div>
      <PageHeader title={t('nav.dashboard')} subtitle={t('dashboard.summary')} />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ icon: Icon, label, value, sub, tone }) => (
          <div key={label} className="card p-5 relative overflow-hidden">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone}`} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</div>
                <div className="mt-2 text-3xl font-extrabold text-slate-900">{value}</div>
                <div className="mt-1 text-xs text-slate-500">{sub}</div>
              </div>
              <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${tone} text-white flex items-center justify-center shadow-soft`}>
                <Icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Compliance card */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">{t('dashboard.kpi.compliance')}</h2>
                <p className="text-sm text-slate-500">{t('tasks.title')}</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-brand-700">{compliance}%</span>
                <span className="text-sm text-slate-500 inline-flex items-center gap-1">
                  <TrendingUp size={14} className="text-emerald-600" /> {locale === 'ar' ? 'بناءً على آخر تحديث' : 'based on latest update'}
                </span>
              </div>
            </div>
            <div className="mt-4 h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 transition-all"
                style={{ width: `${compliance}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                {t('tasks.status.completed')}: {completedTasks}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-cyan-50 text-cyan-700">
                {t('tasks.status.inProgress')}: {inProgressTasks}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-50 text-rose-700">
                {t('tasks.status.overdue')}: {overdueTasks}
              </span>
            </div>
          </div>

          {/* By dept */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">{t('dashboard.byDepartment')}</h2>
              <Link to="/app/committees" className="text-xs font-bold text-brand-700 inline-flex items-center gap-1 hover:gap-2 transition-all">
                {t('action.viewAll')} <Arrow size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {Object.entries(byDept).map(([dept, n]) => (
                <div key={dept}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700">{tDept(t, dept as never)}</span>
                    <span className="text-slate-500 text-xs font-semibold">{n}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                      style={{ width: `${(n / deptMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {Object.keys(byDept).length === 0 && (
                <p className="text-sm text-slate-500">{t('common.empty')}</p>
              )}
            </div>
          </div>

          {/* Recent requests */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <h2 className="text-base font-bold text-slate-900">{t('dashboard.recentRequests')}</h2>
              <Link to="/app/requests" className="text-xs font-bold text-brand-700 inline-flex items-center gap-1 hover:gap-2 transition-all">
                {t('action.viewAll')} <Arrow size={12} />
              </Link>
            </div>
            <div className="table-wrap border-0 rounded-none">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('requests.field.id')}</th>
                    <th>{t('requests.field.name')}</th>
                    <th>{t('requests.field.priority')}</th>
                    <th>{t('requests.field.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((r) => (
                    <tr key={r.id}>
                      <td className="font-mono text-xs text-slate-600">{r.id}</td>
                      <td className="font-medium text-slate-800">{r.name}</td>
                      <td>{r.priority ? <StatusBadge tone={priorityToTone(r.priority)}>{tReqPriority(t, r.priority)}</StatusBadge> : '—'}</td>
                      <td><StatusBadge tone={statusToTone(r.status)}>{tReqStatus(t, r.status)}</StatusBadge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column - services panel */}
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">{t('dashboard.servicesPanel')}</h2>
              <Activity size={16} className="text-slate-400" />
            </div>
            <div className="space-y-2">
              {services.map(({ to, icon: Icon, label, tone }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 hover:border-brand-300 hover:bg-brand-50/50 transition"
                >
                  <span className="flex items-center gap-3">
                    <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${tone}`}>
                      <Icon size={18} />
                    </span>
                    <span className="font-semibold text-sm text-slate-800">{label}</span>
                  </span>
                  <Arrow size={14} className="text-slate-400 group-hover:text-brand-600 transition" />
                </Link>
              ))}
            </div>
          </div>

          {/* By status */}
          <div className="card p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">{t('dashboard.byStatus')}</h2>
            <div className="space-y-2">
              {statusOrder.map((s) => {
                const count = byStatus[s] ?? 0;
                if (!count) return null;
                return (
                  <div key={s} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                    <StatusBadge tone={statusToTone(s)}>{tReqStatus(t, s)}</StatusBadge>
                    <span className="font-bold text-slate-800">{count}</span>
                  </div>
                );
              })}
              {Object.keys(byStatus).length === 0 && <p className="text-sm text-slate-500">{t('common.empty')}</p>}
            </div>
          </div>

          {/* Upcoming tasks */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">{t('dashboard.upcomingTasks')}</h2>
              <Link to="/app/tasks" className="text-xs font-bold text-brand-700 inline-flex items-center gap-1 hover:gap-2 transition-all">
                {t('action.viewAll')} <Arrow size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingTasks.map((task) => {
                const c = task.committeeId ? committees.find((x) => x.id === task.committeeId) : undefined;
                return (
                  <div key={task.id} className="rounded-xl border border-slate-200 p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">{task.title}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500 truncate">
                          {task.kind === 'routine' ? t('tasks.kind.routine') : t('tasks.kind.team')}
                          {c ? ` • ${committeeName(c, locale)}` : ''}
                        </div>
                      </div>
                      <StatusBadge tone={statusToTone(task.status)}>{t(`tasks.status.${task.status}`)}</StatusBadge>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-brand-500" style={{ width: `${task.progress}%` }} />
                    </div>
                    <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                      <span>{task.dueDate ?? '—'}</span>
                      <span>{task.progress}%</span>
                    </div>
                  </div>
                );
              })}
              {upcomingTasks.length === 0 && <p className="text-sm text-slate-500">{t('common.empty')}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
