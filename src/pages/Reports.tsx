import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
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

  const cStatusCount = countBy(committees, (x) => x.status);
  const rStatusCount = countBy(requests, (x) => x.status);
  const tStatusCount = countBy(tasks, (x) => x.status);
  const cDeptCount = countBy(
    committees.filter((c) => c.department),
    (c) => c.department as DepartmentKey
  );

  return (
    <div>
      <PageHeader title={t('service.reports.title')} subtitle={t('service.reports.desc')} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportCard title={t('committees.title') + ' — ' + t('committees.field.status')}>
          {Object.entries(cStatusCount).length === 0 ? (
            <Empty />
          ) : (
            Object.entries(cStatusCount).map(([s, n]) => (
              <Row key={s} left={<StatusBadge tone={statusToTone(s as CommitteeStatus)}>{tStatus(t, s as CommitteeStatus)}</StatusBadge>} right={n} />
            ))
          )}
        </ReportCard>

        <ReportCard title={t('committees.title') + ' — ' + t('committees.field.department')}>
          {Object.entries(cDeptCount).length === 0 ? (
            <Empty />
          ) : (
            Object.entries(cDeptCount).map(([d, n]) => (
              <Row key={d} left={<span className="text-sm text-slate-700 font-semibold">{tDept(t, d as DepartmentKey)}</span>} right={n} />
            ))
          )}
        </ReportCard>

        <ReportCard title={t('requests.title') + ' — ' + t('requests.field.status')}>
          {Object.entries(rStatusCount).length === 0 ? (
            <Empty />
          ) : (
            Object.entries(rStatusCount).map(([s, n]) => (
              <Row key={s} left={<StatusBadge tone={statusToTone(s as RequestStatus)}>{tReqStatus(t, s as RequestStatus)}</StatusBadge>} right={n} />
            ))
          )}
        </ReportCard>

        <ReportCard title={t('tasks.title') + ' — ' + t('tasks.field.status')}>
          {Object.entries(tStatusCount).length === 0 ? (
            <Empty />
          ) : (
            Object.entries(tStatusCount).map(([s, n]) => (
              <Row key={s} left={<StatusBadge tone={statusToTone(s as TaskStatus)}>{tTaskStatus(t, s as TaskStatus)}</StatusBadge>} right={n} />
            ))
          )}
        </ReportCard>
      </div>
    </div>
  );
}

function Empty() {
  const { t } = useLanguage();
  return <p className="text-sm text-slate-500">{t('common.empty')}</p>;
}

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ left, right }: { left: React.ReactNode; right: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
      <div>{left}</div>
      <div className="font-bold text-slate-800">{right}</div>
    </div>
  );
}

function countBy<T, K extends string>(arr: T[], pick: (x: T) => K): Record<K, number> {
  return arr.reduce<Record<K, number>>((acc, item) => {
    const k = pick(item);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {} as Record<K, number>);
}
