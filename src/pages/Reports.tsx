import { useRef } from 'react';
import { FileDown, Printer } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import PageHeader from '../components/PageHeader';
import { printElementAsPdf } from '../lib/pdf';
import { BarChart, DonutChart } from '../components/Charts';
import {
  statusToTone,
  tDept,
  tReqStatus,
  tStatus,
  tTaskStatus,
} from '../lib/format';
import {
  CommitteeStatus,
  DepartmentKey,
  RequestStatus,
  TaskStatus,
} from '../data/types';

export default function ReportsPage() {
  const { t } = useLanguage();
  const { committees, requests, tasks } = useData();
  const printRef = useRef<HTMLDivElement>(null);

  const cmtStatusOrder: CommitteeStatus[] = ['active', 'forming', 'frozen', 'closed'];
  const reqStatusOrder: RequestStatus[] = ['new', 'inProgress', 'completed', 'late', 'onTime', 'followUp'];
  const taskStatusOrder: TaskStatus[] = ['planned', 'inProgress', 'completed', 'overdue', 'onHold'];
  const deptOrder: DepartmentKey[] = ['marine', 'geodesy', 'land', 'remoteSensing', 'services'];

  const cmtByStatus = cmtStatusOrder
    .map((s) => ({
      key: s,
      label: tStatus(t, s),
      value: committees.filter((c) => c.status === s).length,
      tone: statusToTone(s),
    }))
    .filter((d) => d.value > 0);

  const cmtByDept = deptOrder
    .map((d) => ({
      key: d,
      label: tDept(t, d),
      value: committees.filter((c) => c.department === d).length,
      tone: 'green' as const,
    }))
    .filter((d) => d.value > 0);

  const reqByStatus = reqStatusOrder
    .map((s) => ({
      key: s,
      label: tReqStatus(t, s),
      value: requests.filter((r) => r.status === s).length,
      tone: statusToTone(s),
    }))
    .filter((d) => d.value > 0);

  const reqByPriority = (['high', 'medium', 'low'] as const)
    .map((p) => ({
      key: p,
      label: t(`requests.priority.${p}` as const),
      value: requests.filter((r) => r.priority === p).length,
      tone: p === 'high' ? ('rose' as const) : p === 'medium' ? ('amber' as const) : ('slate' as const),
    }))
    .filter((d) => d.value > 0);

  const taskByStatus = taskStatusOrder
    .map((s) => ({
      key: s,
      label: tTaskStatus(t, s),
      value: tasks.filter((task) => task.status === s).length,
      tone: statusToTone(s),
    }))
    .filter((d) => d.value > 0);

  const taskByKind = (['routine', 'team'] as const)
    .map((k) => ({
      key: k,
      label: t(`tasks.kind.${k}` as const),
      value: tasks.filter((task) => task.kind === k).length,
      tone: k === 'routine' ? ('amber' as const) : ('green' as const),
    }))
    .filter((d) => d.value > 0);

  const completed = tasks.filter((task) => task.status === 'completed').length;
  const compliance = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

  return (
    <div>
      <PageHeader
        title={t('service.reports.title')}
        subtitle={t('service.reports.desc')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-ghost print:hidden"
              onClick={() => printRef.current && printElementAsPdf(printRef.current, t('service.reports.title'))}
            >
              <FileDown size={16} /> {t('action.pdf')}
            </button>
            <button type="button" className="btn-secondary print:hidden" onClick={() => window.print()}>
              <Printer size={16} /> {t('action.print')}
            </button>
          </div>
        }
      />

      <div ref={printRef}>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiTile label={t('committees.title')} value={committees.length} tone="from-emerald-500 to-emerald-700" />
        <KpiTile label={t('requests.title')} value={requests.length} tone="from-sky-500 to-blue-700" />
        <KpiTile label={t('tasks.title')} value={tasks.length} tone="from-amber-500 to-orange-600" />
        <KpiTile label={t('dashboard.kpi.compliance')} value={`${compliance}%`} tone="from-violet-500 to-fuchsia-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportCard title={`${t('committees.title')} — ${t('committees.field.status')}`}>
          <DonutChart data={cmtByStatus} centerLabel={t('common.total')} />
        </ReportCard>

        <ReportCard title={`${t('committees.title')} — ${t('committees.field.department')}`}>
          <BarChart data={cmtByDept} />
        </ReportCard>

        <ReportCard title={`${t('requests.title')} — ${t('requests.field.status')}`}>
          <DonutChart data={reqByStatus} centerLabel={t('common.total')} />
        </ReportCard>

        <ReportCard title={`${t('requests.title')} — ${t('requests.field.priority')}`}>
          <BarChart data={reqByPriority} />
        </ReportCard>

        <ReportCard title={`${t('tasks.title')} — ${t('tasks.field.status')}`}>
          <DonutChart data={taskByStatus} centerLabel={t('common.total')} />
        </ReportCard>

        <ReportCard title={`${t('tasks.title')} — ${t('tasks.field.kind')}`}>
          <DonutChart data={taskByKind} centerLabel={t('common.total')} />
        </ReportCard>
      </div>
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="card p-5 relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone}`} />
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-extrabold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}
