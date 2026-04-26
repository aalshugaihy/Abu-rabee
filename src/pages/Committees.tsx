import { useMemo, useState } from 'react';
import { Plus, Search, Trash2, Pencil } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { Committee, CommitteeScope, CommitteeStatus, CommitteeType, DepartmentKey } from '../data/types';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { committeeName, statusToTone, tCommitteeScope, tCommitteeType, tDept, tStatus } from '../lib/format';

const STATUSES: CommitteeStatus[] = ['forming', 'active', 'frozen', 'closed'];
const SCOPES: CommitteeScope[] = ['internal', 'external', 'regional', 'international', 'sector'];
const TYPES: CommitteeType[] = ['regulatory', 'technical', 'advisory', 'executive'];
const DEPTS: DepartmentKey[] = ['marine', 'geodesy', 'land', 'remoteSensing', 'services'];

type FormState = Partial<Committee>;

export default function CommitteesPage() {
  const { t, locale } = useLanguage();
  const { committees, addCommittee, updateCommittee, removeCommittee } = useData();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CommitteeStatus>('all');
  const [deptFilter, setDeptFilter] = useState<'all' | DepartmentKey>('all');
  const [editing, setEditing] = useState<Committee | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    return committees.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (deptFilter !== 'all' && c.department !== deptFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const blob = `${c.name} ${c.nameEn ?? ''} ${c.representative ?? ''} ${c.head ?? ''} ${c.organizer ?? ''}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [committees, statusFilter, deptFilter, query]);

  return (
    <div>
      <PageHeader
        title={t('committees.title')}
        subtitle={t('committees.subtitle')}
        actions={
          <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
            <Plus size={16} />
            {t('action.addNew')}
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
              className="input pl-10 ps-10"
            />
          </div>
          <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as never)}>
            <option value="all">{t('common.all')} — {t('committees.field.status')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{tStatus(t, s)}</option>
            ))}
          </select>
          <select className="select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value as never)}>
            <option value="all">{t('common.all')} — {t('committees.field.department')}</option>
            {DEPTS.map((d) => (
              <option key={d} value={d}>{tDept(t, d)}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState title={t('common.empty')} />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
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
                <tr key={c.id}>
                  <td className="font-mono text-xs text-slate-600">{c.id}</td>
                  <td className="max-w-md">
                    <div className="font-semibold text-slate-800">{committeeName(c, locale)}</div>
                    {c.organizer && <div className="text-xs text-slate-500 mt-0.5">{c.organizer}</div>}
                  </td>
                  <td className="text-slate-700">{tCommitteeScope(t, c.scope)}</td>
                  <td className="text-slate-700">{tDept(t, c.department)}</td>
                  <td className="text-slate-700 max-w-[12rem] truncate">{c.representative ?? '—'}</td>
                  <td><StatusBadge tone={statusToTone(c.status)}>{tStatus(t, c.status)}</StatusBadge></td>
                  <td className="text-end whitespace-nowrap">
                    <button type="button" className="btn-ghost px-2 py-1.5" onClick={() => setEditing(c)} aria-label={t('action.edit')}>
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-ghost px-2 py-1.5 text-rose-600 hover:bg-rose-50"
                      onClick={() => {
                        if (confirm(t('action.confirmDelete'))) removeCommittee(c.id);
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
            if (editing) updateCommittee(editing.id, data);
            else
              addCommittee({
                name: data.name ?? '',
                scope: data.scope ?? 'internal',
                status: data.status ?? 'forming',
                active: data.active ?? true,
                ...data,
              } as Committee);
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
  const set = <K extends keyof Committee>(key: K, value: Committee[K] | undefined) =>
    setForm((p) => ({ ...p, [key]: value }));

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? t('action.edit') : t('action.addNew')}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>{t('action.cancel')}</button>
          <button type="button" className="btn-primary" onClick={() => onSubmit(form)} disabled={!form.name}>
            {t('action.save')}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="label">{t('committees.field.name')} *</label>
          <input className="input" value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
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
