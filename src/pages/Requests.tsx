import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Pencil, Download, ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { downloadCsv, toCsv } from '../lib/csv';
import { matchLabel } from '../lib/match';
import CsvImportButton from '../components/CsvImportButton';
import BulkBar from '../components/BulkBar';
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
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | RequestPriority>('all');
  const [editing, setEditing] = useState<RequestRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function handleExport() {
    const rows = filtered.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type ? tReqType(t, r.type) : '',
      classification: r.classification ? tReqClassification(t, r.classification) : '',
      priority: r.priority ? tReqPriority(t, r.priority) : '',
      sector: tSector(t, r.sector),
      department: tDept(t, r.department),
      purpose: r.purpose ? tReqPurpose(t, r.purpose) : '',
      direction: r.direction ? tReqDirection(t, r.direction) : '',
      txnNumber: r.txnNumber ?? '',
      txnName: r.txnName ?? '',
      status: tReqStatus(t, r.status),
      owner: r.owner ?? '',
      date: r.date ?? '',
      dueDate: r.dueDate ?? '',
    }));
    const csv = toCsv(rows, [
      { key: 'id', header: t('requests.field.id') },
      { key: 'name', header: t('requests.field.name') },
      { key: 'type', header: t('requests.field.type') },
      { key: 'classification', header: t('requests.field.classification') },
      { key: 'priority', header: t('requests.field.priority') },
      { key: 'sector', header: t('requests.field.sector') },
      { key: 'department', header: t('requests.field.department') },
      { key: 'purpose', header: t('requests.field.purpose') },
      { key: 'direction', header: t('requests.field.direction') },
      { key: 'txnNumber', header: t('requests.field.txnNumber') },
      { key: 'txnName', header: t('requests.field.txnName') },
      { key: 'status', header: t('requests.field.status') },
      { key: 'owner', header: t('requests.field.owner') },
      { key: 'date', header: t('requests.field.date') },
      { key: 'dueDate', header: t('requests.field.dueDate') },
    ]);
    downloadCsv(`requests-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast.success(t('action.export') + ' ✓');
  }

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
          <>
            <CsvImportButton<RequestRecord>
              mapRow={(row) => {
                const name = row[t('requests.field.name')] || row['name'];
                if (!name) return null;
                const idCell = row[t('requests.field.id')] || row['id'];
                return {
                  id: idCell || `REQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
                  name,
                  type: matchLabel(row[t('requests.field.type')] || row['type'], TYPES, (s) => tReqType(t, s)),
                  classification: matchLabel(row[t('requests.field.classification')] || row['classification'], CLASSIFICATIONS, (s) => tReqClassification(t, s)),
                  priority: matchLabel(row[t('requests.field.priority')] || row['priority'], PRIORITIES, (s) => tReqPriority(t, s)),
                  status: matchLabel(row[t('requests.field.status')] || row['status'], STATUSES, (s) => tReqStatus(t, s)) ?? 'new',
                  direction: matchLabel(row[t('requests.field.direction')] || row['direction'], DIRECTIONS, (s) => tReqDirection(t, s)),
                  purpose: matchLabel(row[t('requests.field.purpose')] || row['purpose'], PURPOSES, (s) => tReqPurpose(t, s)),
                  department: matchLabel(row[t('requests.field.department')] || row['department'], DEPTS, (s) => tDept(t, s)),
                  sector: matchLabel(row[t('requests.field.sector')] || row['sector'], SECTORS, (s) => tSector(t, s)),
                  txnNumber: row[t('requests.field.txnNumber')] || row['txnNumber'] || undefined,
                  txnName: row[t('requests.field.txnName')] || row['txnName'] || undefined,
                  owner: row[t('requests.field.owner')] || row['owner'] || undefined,
                  date: row[t('requests.field.date')] || row['date'] || undefined,
                  dueDate: row[t('requests.field.dueDate')] || row['dueDate'] || undefined,
                };
              }}
              onImport={(rows) => rows.forEach((r) => addRequest(r))}
            />
            <button type="button" className="btn-secondary" onClick={handleExport} disabled={filtered.length === 0}>
              <Download size={16} /> {t('action.export')}
            </button>
            <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
              <Plus size={16} /> {t('action.addNew')}
            </button>
          </>
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

      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          onDelete={() => {
            if (confirm(t('bulk.confirmDelete'))) {
              const ids = [...selected];
              ids.forEach((sid) => removeRequest(sid));
              setSelected(new Set());
              toast.success(`${ids.length} ${t('action.delete')} ✓`);
            }
          }}
        />
      )}

      {filtered.length === 0 ? (
        <div className="card"><EmptyState title={t('common.empty')} /></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="w-8">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={filtered.length > 0 && filtered.every((r) => selected.has(r.id))}
                    onChange={(e) => {
                      const ids = filtered.map((r) => r.id);
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) ids.forEach((i) => next.add(i));
                        else ids.forEach((i) => next.delete(i));
                        return next;
                      });
                    }}
                  />
                </th>
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
                <tr key={r.id} className={selected.has(r.id) ? 'bg-brand-50/40' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${r.id}`}
                      checked={selected.has(r.id)}
                      onChange={() => toggleSelected(r.id)}
                    />
                  </td>
                  <td className="font-mono text-xs text-slate-600 whitespace-nowrap">{r.id}</td>
                  <td className="font-medium text-slate-800 max-w-sm">
                    <Link to={`/app/requests/${r.id}`} className="block hover:text-brand-700">
                      <div className="truncate">{r.name}</div>
                      {r.txnName && <div className="text-xs text-slate-500 mt-0.5">{r.txnName}</div>}
                    </Link>
                  </td>
                  <td>{r.type ? tReqType(t, r.type) : '—'}</td>
                  <td>{r.classification ? tReqClassification(t, r.classification) : '—'}</td>
                  <td>{r.priority ? <StatusBadge tone={priorityToTone(r.priority)}>{tReqPriority(t, r.priority)}</StatusBadge> : '—'}</td>
                  <td className="text-slate-700">{tDept(t, r.department)}</td>
                  <td>{r.direction ? tReqDirection(t, r.direction) : '—'}</td>
                  <td><StatusBadge tone={statusToTone(r.status)}>{tReqStatus(t, r.status)}</StatusBadge></td>
                  <td className="whitespace-nowrap text-xs text-slate-500">{r.date ?? '—'}</td>
                  <td className="text-end whitespace-nowrap">
                    <Link to={`/app/requests/${r.id}`} className="btn-ghost px-2 py-1.5" aria-label="Open">
                      <ExternalLink size={15} />
                    </Link>
                    <button className="btn-ghost px-2 py-1.5" onClick={() => setEditing(r)} aria-label={t('action.edit')}>
                      <Pencil size={15} />
                    </button>
                    <button
                      className="btn-ghost px-2 py-1.5 text-rose-600 hover:bg-rose-50"
                      onClick={() => {
                        if (confirm(t('action.confirmDelete'))) {
                          removeRequest(r.id);
                          toast.success(`${r.id} ${t('action.delete')} ✓`);
                        }
                      }}
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
            if (editing) {
              updateRequest(editing.id, data);
              toast.success(`${editing.id} ${t('action.save')} ✓`);
            } else {
              addRequest({ name: data.name ?? '', status: data.status ?? 'new', ...data } as RequestRecord);
              toast.success(t('action.addNew') + ' ✓');
            }
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
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof RequestRecord>(key: K, value: RequestRecord[K] | undefined) =>
    setForm((p) => ({ ...p, [key]: value }));
  const nameInvalid = touched && !form.name?.trim();

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? t('action.edit') : t('action.addNew')}
      size="lg"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>{t('action.cancel')}</button>
          <button
            className="btn-primary"
            onClick={() => {
              setTouched(true);
              if (form.name?.trim()) onSubmit(form);
            }}
          >
            {t('action.save')}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="label">{t('requests.field.name')} *</label>
          <input
            className={`input ${nameInvalid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
            value={form.name ?? ''}
            onChange={(e) => set('name', e.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={nameInvalid}
          />
          {nameInvalid && <p className="mt-1 text-xs font-semibold text-rose-600">{t('form.required')}</p>}
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
