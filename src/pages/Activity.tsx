import { useEffect, useMemo, useState } from 'react';
import { Download, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import MultiSelect from '../components/MultiSelect';
import ActivityFeed from '../components/ActivityFeed';
import { api } from '../lib/api';
import { downloadCsv, toCsv } from '../lib/csv';
import { formatDateTime } from '../lib/datetime';
import { ActivityAction, ActivityEntity, ActivityLog } from '../data/types';

const ENTITIES: ActivityEntity[] = ['committee', 'request', 'task'];
const ACTIONS: ActivityAction[] = ['create', 'update', 'delete'];

type Page = { items: ActivityLog[]; total: number; page: number; limit: number };

export default function ActivityPage() {
  const { t, dir } = useLanguage();
  const { apiAvailable } = useAuth();
  const { activity: localActivity } = useData();
  const toast = useToast();
  const Prev = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const Next = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const [entityFilter, setEntityFilter] = useState<ActivityEntity[]>([]);
  const [actionFilter, setActionFilter] = useState<ActivityAction[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [q, setQ] = useState('');
  const [pageNum, setPageNum] = useState(1);
  const [pageLimit] = useState(50);

  const [remote, setRemote] = useState<Page | null>(null);
  const [loading, setLoading] = useState(false);

  function buildQuery() {
    const p = new URLSearchParams();
    if (entityFilter.length === 1) p.set('entity', entityFilter[0]);
    if (actionFilter.length === 1) p.set('action', actionFilter[0]);
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    if (q.trim()) p.set('q', q.trim());
    p.set('page', String(pageNum));
    p.set('limit', String(pageLimit));
    return p.toString();
  }

  // Fetch remote activity when API is on. Refetch on filter change.
  useEffect(() => {
    if (!apiAvailable) return;
    setLoading(true);
    api
      .get<Page>(`/api/activity?${buildQuery()}`)
      .then(setRemote)
      .catch(() => setRemote({ items: [], total: 0, page: 1, limit: pageLimit }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiAvailable, entityFilter, actionFilter, from, to, q, pageNum]);

  // Filter the local activity (offline mode) using the same controls.
  const localFiltered = useMemo(() => {
    return localActivity.filter((a) => {
      if (entityFilter.length > 0 && !entityFilter.includes(a.entity)) return false;
      if (actionFilter.length > 0 && !actionFilter.includes(a.action)) return false;
      if (from && a.at < from) return false;
      if (to && a.at > to + 'T23:59:59') return false;
      if (q && !`${a.label ?? ''} ${a.entityId}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [localActivity, entityFilter, actionFilter, from, to, q]);

  const items = apiAvailable ? remote?.items ?? [] : localFiltered;
  const total = apiAvailable ? remote?.total ?? 0 : localFiltered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageLimit));

  function handleExport() {
    const rows = items.map((a) => ({
      id: a.id,
      at: formatDateTime(a.at),
      entity: t(`activity.${a.entity}` as const),
      action: t(`activity.${a.action}` as const),
      entityId: a.entityId,
      label: a.label ?? '',
    }));
    const csv = toCsv(rows, [
      { key: 'id', header: t('activity.field.id') },
      { key: 'at', header: t('activity.field.at') },
      { key: 'entity', header: t('activity.field.entity') },
      { key: 'action', header: t('activity.field.action') },
      { key: 'entityId', header: t('activity.field.id') },
      { key: 'label', header: t('activity.field.label') },
    ]);
    downloadCsv(`activity-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast.success(t('action.export') + ' ✓');
  }

  return (
    <div>
      <PageHeader
        title={t('activity.title')}
        subtitle={t('activity.subtitle')}
        actions={
          <button type="button" className="btn-secondary" onClick={handleExport} disabled={items.length === 0}>
            <Download size={16} /> {t('action.export')}
          </button>
        }
      />

      <div className="card p-4 mb-5 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-1 relative">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPageNum(1);
            }}
            placeholder={t('action.search')}
            className="input ps-10"
          />
        </div>
        <MultiSelect<ActivityEntity>
          options={ENTITIES.map((e) => ({ value: e, label: t(`activity.${e}` as const) }))}
          value={entityFilter}
          onChange={(v) => {
            setEntityFilter(v);
            setPageNum(1);
          }}
          placeholder={t('activity.field.entity')}
        />
        <MultiSelect<ActivityAction>
          options={ACTIONS.map((a) => ({ value: a, label: t(`activity.${a}` as const) }))}
          value={actionFilter}
          onChange={(v) => {
            setActionFilter(v);
            setPageNum(1);
          }}
          placeholder={t('activity.field.action')}
        />
        <div className="grid grid-cols-2 gap-2">
          <input type="date" className="input" value={from} onChange={(e) => { setFrom(e.target.value); setPageNum(1); }} aria-label={t('filter.dateFrom')} />
          <input type="date" className="input" value={to} onChange={(e) => { setTo(e.target.value); setPageNum(1); }} aria-label={t('filter.dateTo')} />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <div className="card"><EmptyState title={t('common.empty')} /></div>
      ) : (
        <div className="card p-6">
          <ActivityFeed logs={items} />
        </div>
      )}

      {apiAvailable && total > pageLimit && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button type="button" className="btn-ghost" onClick={() => setPageNum((p) => Math.max(1, p - 1))} disabled={pageNum === 1}>
            <Prev size={16} /> {t('activity.prev')}
          </button>
          <span className="text-slate-600">
            {pageNum} / {totalPages} · {total}
          </span>
          <button type="button" className="btn-ghost" onClick={() => setPageNum((p) => Math.min(totalPages, p + 1))} disabled={pageNum >= totalPages}>
            {t('activity.next')} <Next size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
