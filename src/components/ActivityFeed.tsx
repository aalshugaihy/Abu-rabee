import { ListChecks, Plus, RefreshCw, Trash2, Users, Inbox } from 'lucide-react';
import { ActivityLog } from '../data/types';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDateTime } from '../lib/datetime';

export default function ActivityFeed({ logs }: { logs: ActivityLog[] }) {
  const { t } = useLanguage();
  if (logs.length === 0) {
    return <p className="text-sm text-slate-500">{t('common.empty')}</p>;
  }
  return (
    <ol className="relative ms-1 ps-5 border-s border-slate-200 space-y-4">
      {logs.map((entry) => (
        <li key={entry.id} className="relative">
          <span className="absolute -start-[26px] top-1 h-4 w-4 rounded-full bg-white border-2 border-brand-500" aria-hidden />
          <div className="flex items-start gap-3">
            <ActionIcon entry={entry} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t(`activity.${entry.action}` as const)} · {t(`activity.${entry.entity}` as const)}
                </span>
                <span className="font-mono text-[10px] text-slate-400">{entry.entityId}</span>
              </div>
              {entry.label && <div className="text-sm font-semibold text-slate-800 truncate mt-0.5">{entry.label}</div>}
              <div className="text-[11px] text-slate-500 mt-0.5">{formatDateTime(entry.at)}</div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ActionIcon({ entry }: { entry: ActivityLog }) {
  const entityIcons = {
    committee: Users,
    request: Inbox,
    task: ListChecks,
  } as const;
  const actionStyles = {
    create: 'bg-emerald-50 text-emerald-600',
    update: 'bg-sky-50 text-sky-600',
    delete: 'bg-rose-50 text-rose-600',
  } as const;
  const actionIcons = {
    create: Plus,
    update: RefreshCw,
    delete: Trash2,
  } as const;
  const EntityIcon = entityIcons[entry.entity];
  const ActionDot = actionIcons[entry.action];
  return (
    <span className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center relative ${actionStyles[entry.action]}`}>
      <EntityIcon size={16} />
      <span className="absolute -end-1 -bottom-1 h-4 w-4 rounded-full bg-white shadow-soft flex items-center justify-center">
        <ActionDot size={10} className="text-slate-700" />
      </span>
    </span>
  );
}
