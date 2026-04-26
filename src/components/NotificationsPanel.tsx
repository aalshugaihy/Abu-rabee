import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Bell, CheckCircle2, Clock, Inbox } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

type Notification = {
  id: string;
  kind: 'overdue' | 'dueSoon' | 'followUp' | 'newRequest';
  title: string;
  subtitle?: string;
  to: string;
};

const STORAGE_KEY = 'abu-rabee.notifications.read';

function loadReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export default function NotificationsPanel() {
  const { t, dir } = useLanguage();
  const { tasks, requests } = useData();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds());
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const notifications = useMemo<Notification[]>(() => {
    const list: Notification[] = [];
    const today = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);

    for (const task of tasks) {
      if (task.status === 'overdue') {
        list.push({
          id: `task:overdue:${task.id}`,
          kind: 'overdue',
          title: task.title,
          subtitle: task.dueDate,
          to: task.kind === 'routine' ? '/app/tasks/routine' : '/app/tasks/teams',
        });
      } else if (task.dueDate && task.status !== 'completed') {
        const due = new Date(task.dueDate);
        if (!isNaN(due.getTime()) && due >= today && due <= soon) {
          list.push({
            id: `task:due:${task.id}`,
            kind: 'dueSoon',
            title: task.title,
            subtitle: task.dueDate,
            to: task.kind === 'routine' ? '/app/tasks/routine' : '/app/tasks/teams',
          });
        }
      }
    }

    for (const r of requests) {
      if (r.status === 'late' || r.status === 'followUp') {
        list.push({
          id: `req:${r.status}:${r.id}`,
          kind: 'followUp',
          title: r.name,
          subtitle: `${r.id} · ${r.dueDate ?? r.date ?? ''}`,
          to: '/app/requests',
        });
      } else if (r.status === 'new') {
        list.push({
          id: `req:new:${r.id}`,
          kind: 'newRequest',
          title: r.name,
          subtitle: `${r.id} · ${r.date ?? ''}`,
          to: '/app/requests',
        });
      }
    }

    return list.slice(0, 30);
  }, [tasks, requests]);

  const unread = notifications.filter((n) => !readIds.has(n.id));
  const hasUnread = unread.length > 0;

  function markAllRead() {
    const next = new Set(readIds);
    notifications.forEach((n) => next.add(n.id));
    setReadIds(next);
    saveReadIds(next);
  }

  function handleOpen() {
    setOpen((v) => {
      const next = !v;
      if (next) {
        // Mark visible notifications as read on open.
        setTimeout(() => {
          const merged = new Set(readIds);
          notifications.forEach((n) => merged.add(n.id));
          setReadIds(merged);
          saveReadIds(merged);
        }, 1500);
      }
      return next;
    });
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative rounded-xl p-2.5 text-slate-600 hover:bg-slate-100"
        aria-label={t('notif.title')}
        aria-expanded={open}
      >
        <Bell size={18} />
        {hasUnread && (
          <span className="absolute top-1 end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute top-full mt-2 w-[320px] sm:w-[380px] rounded-2xl border border-slate-200 bg-white shadow-card animate-slide-up z-40 ${
            dir === 'rtl' ? 'start-0' : 'end-0'
          }`}
          role="dialog"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">{t('notif.title')}</h3>
            </div>
            {hasUnread && (
              <button type="button" onClick={markAllRead} className="text-[11px] font-semibold text-brand-700 hover:underline">
                <CheckCircle2 size={12} className="inline -mt-0.5" /> {t('notif.viewAll')}
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">{t('notif.empty')}</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <Link
                      to={n.to}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition"
                    >
                      <NotifIcon kind={n.kind} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {t(notifKindKey(n.kind))}
                          </span>
                          {!readIds.has(n.id) && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-label="unread" />}
                        </div>
                        <div className="text-sm font-semibold text-slate-800 truncate mt-0.5">{n.title}</div>
                        {n.subtitle && <div className="text-xs text-slate-500 truncate">{n.subtitle}</div>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function notifKindKey(kind: Notification['kind']) {
  switch (kind) {
    case 'overdue':
      return 'notif.overdueTask' as const;
    case 'dueSoon':
      return 'notif.dueSoon' as const;
    case 'followUp':
      return 'notif.followUp' as const;
    case 'newRequest':
      return 'notif.newRequest' as const;
  }
}

function NotifIcon({ kind }: { kind: Notification['kind'] }) {
  const styles = {
    overdue: { bg: 'bg-rose-50 text-rose-600', Icon: AlertTriangle },
    dueSoon: { bg: 'bg-amber-50 text-amber-600', Icon: Clock },
    followUp: { bg: 'bg-amber-50 text-amber-600', Icon: AlertTriangle },
    newRequest: { bg: 'bg-sky-50 text-sky-600', Icon: Inbox },
  } as const;
  const { bg, Icon } = styles[kind];
  return (
    <span className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center ${bg}`}>
      <Icon size={16} />
    </span>
  );
}
