import { useMemo, useState } from 'react';
import { Plus, Search, Trash2, Pencil } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import {
  RequestRecord,
  RequestClassification,
  RequestDirection,
  RequestPriority,
  RequestPurpose,
  RequestStatus,
  RequestType,
  DepartmentKey,
  SectorKey,
} from '../data/types';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
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

const STATUSES: RequestStatus[] = ['new', 'inProgress', 'completed', 'late', 'onTime', 'followUp'];
const PRIORITIES: RequestPriority[] = ['high', 'medium', 'low'];
const TYPES: RequestType[] = ['president', 'deputy', 'internal', 'task'];
const PURPOSES: RequestPurpose[] = ['completion', 'feedback', 'approval', 'update'];
const DIRECTIONS: RequestDirection[] = ['in', 'out'];
const CLASSIFICATIONS: RequestClassification[] = ['internal', 'external'];
const DEPTS: DepartmentKey[] = ['marine', 'geodesy', 'land', 'remoteSensing', 'services'];
const SECTORS: SectorKey[] = ['survey', 'investment', 'knowledge', 'center', 'surveyWorks'];

type FormState = Partial<RequestRecord>;

export default function RequestsPage() {
  const { t } = useLanguage();
  const { requests, addRequest, updateRequest, removeRequest } = useData();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | RequestPriority>('all');
  const [editing, setEditing] = useState<RequestRecord | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const blob = `${r.id} ${r.name} ${r.requester ?? ''} ${r.txnName ?? ''}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [requests, statusFilter, priorityFilter, query]);

  return (
    <div>
      <PageHeader
        title={t('requests.title')}
        subtitle={t('requests.subtitle')}
        actions={
          <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
            <Plus size={16} /> {t('action.addNew')}
          </button>
        }
      />

      <div className="card p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
            <option value="all">{t('common.all')} — {t('requests.field.status')}</option>
            {STATUSES.map((s) => (<option key={s} value={s}>{tReqStatus(t, s)}</option>))}
          </select>
          <select className="select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as never)}>
            <option value="all">{t('common.all')} — {t('requests.field.priority')}</option>
            {PRIORITIES.map((s) => (<option key={s} value={s}>{tReqPriority(t, s)}</option>))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState title={t('common.empty')} /></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t('requests.field.id')}</th>
                <th>{t('requests.field.name')}</th>
                <th>{t('requests.field.type')}</th>
                <th>{t('requests.field.classification')}</th>
                <th>{t('requests.field.priority')}</th>
                <th>{t('requests.field.department')}</th>
                <th>{t('requests.field.direction')}</th>
                <th>{t('requests.field.status')}</th>
                <th>{t('requests.field.date')}</th>
                <th className="text-end"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs text-slate-600 whitespace-nowrap">{r.id}</td>
                  <td className="font-medium text-slate-800 max-w-sm">
                    <div className="truncate">{r.name}</div>
                    {r.txnName && <div className="text-xs text-slate-500 mt-0.5">{r.txnName}</div>}
                  </td>
                  <td>{r.type ? tReqType(t, r.type) : '—'}</td>
                  <td>{r.classification ? tReqClassification(t, r.classification) : '—'}</td>
                  <td>{r.priority ? <StatusBadge tone={priorityToTone(r.priority)}>{tReqPriority(t, r.priority)}</StatusBadge> : '—'}</td>
                  <td className="text-slate-700">{tDept(t, r.department)}</td>
                  <td>{r.direction ? tReqDirection(t, r.direction) : '—'}</td>
                  <td><StatusBadge tone={statusToTone(r.status)}>{tReqStatus(t, r.status)}</StatusBadge></td>
                  <td className="whitespace-nowrap text-xs text-slate-500">{r.date ?? '—'}</td>
                  <td className="text-end whitespace-nowrap">
                    <button className="btn-ghost px-2 py-1.5" onClick={() => setEditing(r)} aria-label={t('action.edit')}>
                      <Pencil size={15} />
                    </button>
                    <button
                      className="btn-ghost px-2 py-1.5 text-rose-600 hover:bg-rose-50"
                      onClick={() => { if (confirm(t('action.confirmDelete'))) removeRequest(r.id); }}
                      aria-label={t('action.delete')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <RequestForm
          initial={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSubmit={(data) => {
            if (editing) updateRequest(editing.id, data);
            else addRequest({ name: data.name ?? '', status: data.status ?? 'new', ...data } as RequestRecord);
            setCreating(false); setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function RequestForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: RequestRecord;
  onClose: () => void;
  onSubmit: (data: FormState) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<FormState>(
    initial ?? { name: '', status: 'new', direction: 'in', classification: 'internal' }
  );
  const set = <K extends keyof RequestRecord>(key: K, value: RequestRecord[K] | undefined) =>
    setForm((p) => ({ ...p, [key]: value }));

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? t('action.edit') : t('action.addNew')}
      size="lg"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>{t('action.cancel')}</button>
          <button className="btn-primary" onClick={() => onSubmit(form)} disabled={!form.name}>{t('action.save')}</button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="label">{t('requests.field.name')} *</label>
          <input className="input" value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label className="label">{t('requests.field.type')}</label>
          <select className="select" value={form.type ?? ''} onChange={(e) => set('type', (e.target.value || undefined) as RequestType | undefined)}>
            <option value="">—</option>
            {TYPES.map((x) => (<option key={x} value={x}>{tReqType(t, x)}</option>))}
          </select>
        </div>
        <div>
          <label className="label">{t('requests.field.classification')}</label>
          <select className="select" value={form.classification ?? ''} onChange={(e) => set('classification', (e.target.value || undefined) as RequestClassification | undefined)}>
            <option value="">—</option>
            {CLASSIFICATIONS.map((x) => (<option key={x} value={x}>{tReqClassification(t, x)}</option>))}
          </select>
        </div>
        <div>
          <label className="label">{t('requests.field.requester')}</label>
          <input className="input" value={form.requester ?? ''} onChange={(e) => set('requester', e.target.value || undefined)} />
        </div>
        <div>
          <label className="label">{t('requests.field.priority')}</label>
          <select className="select" value={form.priority ?? ''} onChange={(e) => set('priority', (e.target.value || undefined) as RequestPriority | undefined)}>
            <option value="">—</option>
            {PRIORITIES.map((x) => (<option key={x} value={x}>{tReqPriority(t, x)}</option>))}
          </select>
        </div>
        <div>
          <label className="label">{t('requests.field.sector')}</label>
          <select className="select" value={form.sector ?? ''} onChange={(e) => set('sector', (e.target.value || undefined) as SectorKey | undefined)}>
            <option value="">—</option>
            {SECTORS.map((x) => (<option key={x} value={x}>{tSector(t, x)}</option>))}
          </select>
        </div>
        <div>
          <label className="label">{t('requests.field.department')}</label>
          <select className="select" value={form.department ?? ''} onChange={(e) => set('department', (e.target.value || undefined) as DepartmentKey | undefined)}>
            <option value="">—</option>
            {DEPTS.map((x) => (<option key={x} value={x}>{tDept(t, x)}</option>))}
          </select>
        </div>
        <div>
          <label className="label">{t('requests.field.purpose')}</label>
          <select className="select" value={form.purpose ?? ''} onChange={(e) => set('purpose', (e.target.value || undefined) as RequestPurpose | undefined)}>
            <option value="">—</option>
            {PURPOSES.map((x) => (<option key={x} value={x}>{tReqPurpose(t, x)}</option>))}
          </select>
        </div>
        <div>
          <label className="label">{t('requests.field.direction')}</label>
          <select className="select" value={form.direction ?? ''} onChange={(e) => set('direction', (e.target.value || undefined) as RequestDirection | undefined)}>
            <option value="">—</option>
            {DIRECTIONS.map((x) => (<option key={x} value={x}>{tReqDirection(t, x)}</option>))}
          </select>
        </div>
        <div>
          <label className="label">{t('requests.field.status')}</label>
          <select className="select" value={form.status ?? 'new'} onChange={(e) => set('status', e.target.value as RequestStatus)}>
            {STATUSES.map((x) => (<option key={x} value={x}>{tReqStatus(t, x)}</option>))}
          </select>
        </div>
        <div>
          <label className="label">{t('requests.field.txnNumber')}</label>
          <input className="input" value={form.txnNumber ?? ''} onChange={(e) => set('txnNumber', e.target.value || undefined)} />
        </div>
        <div>
          <label className="label">{t('requests.field.txnName')}</label>
          <input className="input" value={form.txnName ?? ''} onChange={(e) => set('txnName', e.target.value || undefined)} />
        </div>
        <div>
          <label className="label">{t('requests.field.owner')}</label>
          <input className="input" value={form.owner ?? ''} onChange={(e) => set('owner', e.target.value || undefined)} />
        </div>
        <div>
          <label className="label">{t('requests.field.date')}</label>
          <input type="date" className="input" value={form.date ?? ''} onChange={(e) => set('date', e.target.value || undefined)} />
        </div>
        <div>
          <label className="label">{t('requests.field.dueDate')}</label>
          <input type="date" className="input" value={form.dueDate ?? ''} onChange={(e) => set('dueDate', e.target.value || undefined)} />
        </div>
      </div>
    </Modal>
  );
}
