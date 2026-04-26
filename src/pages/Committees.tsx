import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Pencil, Download, ExternalLink } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Committee, CommitteeScope, CommitteeStatus, CommitteeType, DepartmentKey } from '../data/types';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import CsvImportButton from '../components/CsvImportButton';
import BulkBar from '../components/BulkBar';
import MultiSelect from '../components/MultiSelect';
import SavedViews from '../components/SavedViews';
import { committeeName, statusToTone, tCommitteeScope, tCommitteeType, tDept, tStatus } from '../lib/format';
import { downloadCsv, toCsv } from '../lib/csv';
import { matchLabel } from '../lib/match';

const STATUSES: CommitteeStatus[] = ['forming', 'active', 'frozen', 'closed'];
const SCOPES: CommitteeScope[] = ['internal', 'external', 'regional', 'international', 'sector'];
const TYPES: CommitteeType[] = ['regulatory', 'technical', 'advisory', 'executive'];
const DEPTS: DepartmentKey[] = ['marine', 'geodesy', 'land', 'remoteSensing', 'services'];

type FormState = Partial<Committee>;

export default function CommitteesPage() {
  const { t, locale } = useLanguage();
  const { committees, addCommittee, updateCommittee, removeCommittee } = useData();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CommitteeStatus[]>([]);
  const [deptFilter, setDeptFilter] = useState<DepartmentKey[]>([]);
  const [scopeFilter, setScopeFilter] = useState<CommitteeScope[]>([]);
  const [editing, setEditing] = useState<Committee | null>(null);
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
    const rows = filtered.map((c) => ({
      id: c.id,
      name: c.name,
      nameEn: c.nameEn ?? '',
      type: c.type ? tCommitteeType(t, c.type) : '',
      scope: tCommitteeScope(t, c.scope),
      department: tDept(t, c.department),
      representative: c.representative ?? '',
      head: c.head ?? '',
      organizer: c.organizer ?? '',
      status: tStatus(t, c.status),
      members: c.members ?? '',
      startDate: c.startDate ?? '',
      endDate: c.endDate ?? '',
    }));
    const csv = toCsv(rows, [
      { key: 'id', header: t('committees.field.id') },
      { key: 'name', header: t('committees.field.name') },
      { key: 'nameEn', header: t('committees.field.name') + ' (EN)' },
      { key: 'type', header: t('committees.field.type') },
      { key: 'scope', header: t('committees.field.scope') },
      { key: 'department', header: t('committees.field.department') },
      { key: 'representative', header: t('committees.field.representative') },
      { key: 'head', header: t('committees.field.head') },
      { key: 'organizer', header: t('committees.field.organizer') },
      { key: 'status', header: t('committees.field.status') },
      { key: 'members', header: t('committees.field.members') },
      { key: 'startDate', header: t('committees.field.startDate') },
      { key: 'endDate', header: t('committees.field.endDate') },
    ]);
    downloadCsv(`committees-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast.success(t('action.export') + ' ✓');
  }

  const filtered = useMemo(() => {
    return committees.filter((c) => {
      if (statusFilter.length > 0 && !statusFilter.includes(c.status)) return false;
      if (deptFilter.length > 0 && (!c.department || !deptFilter.includes(c.department))) return false;
      if (scopeFilter.length > 0 && !scopeFilter.includes(c.scope)) return false;
      if (query) {
        const q = query.toLowerCase();
        const blob = `${c.name} ${c.nameEn ?? ''} ${c.representative ?? ''} ${c.head ?? ''} ${c.organizer ?? ''}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [committees, statusFilter, deptFilter, scopeFilter, query]);

  const filterState = useMemo(
    () => ({ query, status: statusFilter, department: deptFilter, scope: scopeFilter }),
    [query, statusFilter, deptFilter, scopeFilter]
  );

  function applyView(f: typeof filterState) {
    setQuery(f.query ?? '');
    setStatusFilter(f.status ?? []);
    setDeptFilter(f.department ?? []);
    setScopeFilter(f.scope ?? []);
  }

  return (
    <div>
      <PageHeader
        title={t('committees.title')}
        subtitle={t('committees.subtitle')}
        actions={
          <>
            <CsvImportButton<Committee>
              mapRow={(row) => {
                const name = row[t('committees.field.name')] || row['name'] || row['الاسم'];
                if (!name) return null;
                return {
                  id: row[t('committees.field.id')] || row['id'] || `CMT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  name,
                  nameEn: row[`${t('committees.field.name')} (EN)`] || row['nameEn'] || undefined,
                  scope: matchLabel(row[t('committees.field.scope')] || row['scope'], SCOPES, (s) => tCommitteeScope(t, s)) ?? 'internal',
                  status: matchLabel(row[t('committees.field.status')] || row['status'], STATUSES, (s) => tStatus(t, s)) ?? 'active',
                  type: matchLabel(row[t('committees.field.type')] || row['type'], TYPES, (s) => tCommitteeType(t, s)),
                  department: matchLabel(row[t('committees.field.department')] || row['department'], DEPTS, (d) => tDept(t, d)),
                  representative: row[t('committees.field.representative')] || row['representative'] || undefined,
                  head: row[t('committees.field.head')] || row['head'] || undefined,
                  organizer: row[t('committees.field.organizer')] || row['organizer'] || undefined,
                  active: true,
                };
              }}
              onImport={(rows) => rows.forEach((c) => addCommittee(c))}
            />
            <button type="button" className="btn-secondary" onClick={handleExport} disabled={filtered.length === 0}>
              <Download size={16} />
              {t('action.export')}
            </button>
            <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
              <Plus size={16} />
              {t('action.addNew')}
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
          <MultiSelect<CommitteeStatus>
            options={STATUSES.map((s) => ({ value: s, label: tStatus(t, s) }))}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder={t('committees.field.status')}
          />
          <MultiSelect<DepartmentKey>
            options={DEPTS.map((d) => ({ value: d, label: tDept(t, d) }))}
            value={deptFilter}
            onChange={setDeptFilter}
            placeholder={t('committees.field.department')}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
          <MultiSelect<CommitteeScope>
            options={SCOPES.map((s) => ({ value: s, label: tCommitteeScope(t, s) }))}
            value={scopeFilter}
            onChange={setScopeFilter}
            placeholder={t('committees.field.scope')}
          />
          <div className="md:col-span-3 flex items-center justify-end">
            <SavedViews<typeof filterState> page="committees" current={filterState} onApply={applyView} />
          </div>
        </div>
      </div>

      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          onDelete={() => {
            if (confirm(t('bulk.confirmDelete'))) {
              const ids = [...selected];
              ids.forEach((sid) => removeCommittee(sid));
              setSelected(new Set());
              toast.success(`${ids.length} ${t('action.delete')} ✓`);
            }
          }}
        />
      )}

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState title={t('common.empty')} />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th className="w-8">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={filtered.length > 0 && filtered.every((c) => selected.has(c.id))}
                    onChange={(e) => {
                      const ids = filtered.map((c) => c.id);
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) ids.forEach((i) => next.add(i));
                        else ids.forEach((i) => next.delete(i));
                        return next;
                      });
                    }}
                  />
                </th>
                <th>{t('committees.field.id')}</th>
                <th>{t('committees.field.name')}</th>
                <th>{t('committees.field.scope')}</th>
                <th>{t('committees.field.department')}</th>
                <th>{t('committees.field.representative')}</th>
                <th>{t('committees.field.status')}</th>
                <th className="text-end"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className={selected.has(c.id) ? 'bg-brand-50/40' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select ${c.id}`}
                      checked={selected.has(c.id)}
                      onChange={() => toggleSelected(c.id)}
                    />
                  </td>
                  <td className="font-mono text-xs text-slate-600">{c.id}</td>
                  <td className="max-w-md">
                    <Link to={`/app/committees/${c.id}`} className="block hover:text-brand-700">
                      <div className="font-semibold text-slate-800">{committeeName(c, locale)}</div>
                      {c.organizer && <div className="text-xs text-slate-500 mt-0.5">{c.organizer}</div>}
                    </Link>
                  </td>
                  <td className="text-slate-700">{tCommitteeScope(t, c.scope)}</td>
                  <td className="text-slate-700">{tDept(t, c.department)}</td>
                  <td className="text-slate-700 max-w-[12rem] truncate">{c.representative ?? '—'}</td>
                  <td><StatusBadge tone={statusToTone(c.status)}>{tStatus(t, c.status)}</StatusBadge></td>
                  <td className="text-end whitespace-nowrap">
                    <Link to={`/app/committees/${c.id}`} className="btn-ghost px-2 py-1.5" aria-label="Open">
                      <ExternalLink size={15} />
                    </Link>
                    <button type="button" className="btn-ghost px-2 py-1.5" onClick={() => setEditing(c)} aria-label={t('action.edit')}>
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-ghost px-2 py-1.5 text-rose-600 hover:bg-rose-50"
                      onClick={() => {
                        if (confirm(t('action.confirmDelete'))) {
                          removeCommittee(c.id);
                          toast.success(`${c.id} ${t('action.delete')} ✓`);
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
        <CommitteeForm
          initial={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSubmit={(data) => {
            if (editing) {
              updateCommittee(editing.id, data);
              toast.success(`${editing.id} ${t('action.save')} ✓`);
            } else {
              addCommittee({
                name: data.name ?? '',
                scope: data.scope ?? 'internal',
                status: data.status ?? 'forming',
                active: data.active ?? true,
                ...data,
              } as Committee);
              toast.success(t('action.addNew') + ' ✓');
            }
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function CommitteeForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: Committee;
  onClose: () => void;
  onSubmit: (data: FormState) => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<FormState>(
    initial ?? {
      name: '',
      scope: 'internal',
      status: 'forming',
      active: true,
    }
  );
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof Committee>(key: K, value: Committee[K] | undefined) =>
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
          <button type="button" className="btn-ghost" onClick={onClose}>{t('action.cancel')}</button>
          <button
            type="button"
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
          <label className="label">{t('committees.field.name')} *</label>
          <input
            className={`input ${nameInvalid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
            value={form.name ?? ''}
            onChange={(e) => set('name', e.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={nameInvalid}
            aria-describedby={nameInvalid ? 'committee-name-error' : undefined}
          />
          {nameInvalid && (
            <p id="committee-name-error" className="mt-1 text-xs font-semibold text-rose-600">
              {t('form.required')}
            </p>
          )}
        </div>
        <div>
          <label className="label">{t('committees.field.scope')}</label>
          <select className="select" value={form.scope} onChange={(e) => set('scope', e.target.value as CommitteeScope)}>
            {SCOPES.map((s) => (<option key={s} value={s}>{tCommitteeScope(t, s)}</option>))}
          </select>
        </div>
        <div>
          <label className="label">{t('committees.field.type')}</label>
          <select className="select" value={form.type ?? ''} onChange={(e) => set('type', (e.target.value || undefined) as CommitteeType | undefined)}>
            <option value="">—</option>
            {TYPES.map((s) => (<option key={s} value={s}>{tCommitteeType(t, s)}</option>))}
          </select>
        </div>
        <div>
          <label className="label">{t('committees.field.department')}</label>
          <select className="select" value={form.department ?? ''} onChange={(e) => set('department', (e.target.value || undefined) as DepartmentKey | undefined)}>
            <option value="">—</option>
            {DEPTS.map((d) => (<option key={d} value={d}>{tDept(t, d)}</option>))}
          </select>
        </div>
        <div>
          <label className="label">{t('committees.field.status')}</label>
          <select className="select" value={form.status} onChange={(e) => set('status', e.target.value as CommitteeStatus)}>
            {STATUSES.map((s) => (<option key={s} value={s}>{tStatus(t, s)}</option>))}
          </select>
        </div>
        <div>
          <label className="label">{t('committees.field.representative')}</label>
          <input className="input" value={form.representative ?? ''} onChange={(e) => set('representative', e.target.value || undefined)} />
        </div>
        <div>
          <label className="label">{t('committees.field.head')}</label>
          <input className="input" value={form.head ?? ''} onChange={(e) => set('head', e.target.value || undefined)} />
        </div>
        <div className="md:col-span-2">
          <label className="label">{t('committees.field.organizer')}</label>
          <input className="input" value={form.organizer ?? ''} onChange={(e) => set('organizer', e.target.value || undefined)} />
        </div>
        <div>
          <label className="label">{t('committees.field.startDate')}</label>
          <input type="date" className="input" value={form.startDate ?? ''} onChange={(e) => set('startDate', e.target.value || undefined)} />
        </div>
        <div>
          <label className="label">{t('committees.field.endDate')}</label>
          <input type="date" className="input" value={form.endDate ?? ''} onChange={(e) => set('endDate', e.target.value || undefined)} />
        </div>
        <div>
          <label className="label">{t('committees.field.members')}</label>
          <input type="number" className="input" value={form.members ?? ''} onChange={(e) => set('members', e.target.value ? Number(e.target.value) : undefined)} />
        </div>
        <div>
          <label className="label">{t('committees.field.budget')}</label>
          <input type="number" className="input" value={form.budget ?? ''} onChange={(e) => set('budget', e.target.value ? Number(e.target.value) : undefined)} />
        </div>
        <div className="md:col-span-2">
          <label className="label">{t('committees.field.notes')}</label>
          <textarea className="textarea" rows={3} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value || undefined)} />
        </div>
      </div>
    </Modal>
  );
}
