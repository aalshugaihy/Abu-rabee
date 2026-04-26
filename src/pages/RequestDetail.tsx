import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import StatusBadge from '../components/StatusBadge';
import ActivityFeed from '../components/ActivityFeed';
import {
  priorityToTone,
  statusToTone,
  tDept,
  tReqClassification,
  tReqDirection,
  tReqPriority,
  tReqPurpose,
  tReqStatus,
  tReqType,
  tSector,
} from '../lib/format';
import { formatDateTime } from '../lib/datetime';

export default function RequestDetail() {
  const { id } = useParams();
  const { t, dir } = useLanguage();
  const { requests, activity, removeRequest } = useData();
  const navigate = useNavigate();
  const toast = useToast();
  const Arrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const r = requests.find((x) => x.id === id);

  if (!r) {
    return (
      <div className="card p-10 text-center">
        <h2 className="text-lg font-bold text-slate-900">{t('common.empty')}</h2>
        <Link to="/app/requests" className="btn-primary mt-4">{t('detail.back')}</Link>
      </div>
    );
  }

  const logs = activity.filter((a) => a.entity === 'request' && a.entityId === r.id);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Link to="/app/requests" className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-semibold">
          <Arrow size={14} /> {t('detail.back')}
        </Link>
      </div>

      <div className="card p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 to-blue-700" />
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] text-slate-500">{r.id}</span>
              <StatusBadge tone={statusToTone(r.status)}>{tReqStatus(t, r.status)}</StatusBadge>
              {r.priority && <StatusBadge tone={priorityToTone(r.priority)}>{tReqPriority(t, r.priority)}</StatusBadge>}
              {r.direction && <span className="badge bg-slate-100 text-slate-700">{tReqDirection(t, r.direction)}</span>}
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">{r.name}</h1>
          </div>
          <button
            type="button"
            className="btn-ghost text-rose-600 hover:bg-rose-50"
            onClick={() => {
              if (confirm(t('action.confirmDelete'))) {
                removeRequest(r.id);
                toast.success(`${r.id} ${t('action.delete')} ✓`);
                navigate('/app/requests');
              }
            }}
          >
            <Trash2 size={14} /> {t('action.delete')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">{t('detail.overview')}</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <F label={t('requests.field.type')} value={r.type ? tReqType(t, r.type) : undefined} />
              <F label={t('requests.field.classification')} value={r.classification ? tReqClassification(t, r.classification) : undefined} />
              <F label={t('requests.field.requester')} value={r.requester} />
              <F label={t('requests.field.owner')} value={r.owner} />
              <F label={t('requests.field.sector')} value={tSector(t, r.sector)} />
              <F label={t('requests.field.department')} value={tDept(t, r.department)} />
              <F label={t('requests.field.purpose')} value={r.purpose ? tReqPurpose(t, r.purpose) : undefined} />
              <F label={t('requests.field.txnNumber')} value={r.txnNumber} />
              <F label={t('requests.field.txnName')} value={r.txnName} />
              <F label={t('requests.field.date')} value={r.date} />
              <F label={t('requests.field.dueDate')} value={r.dueDate} />
              <F label={t('detail.createdAt')} value={formatDateTime(r.createdAt)} />
              <F label={t('detail.updatedAt')} value={formatDateTime(r.updatedAt)} />
            </dl>
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

function F({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-800 font-medium">{value === undefined || value === '' ? '—' : value}</dd>
    </div>
  );
}
