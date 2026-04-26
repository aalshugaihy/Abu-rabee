import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, ListChecks, Search, Users, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { committeeName } from '../lib/format';

type Hit =
  | { kind: 'committee'; id: string; label: string; sub?: string; to: string }
  | { kind: 'request'; id: string; label: string; sub?: string; to: string }
  | { kind: 'task'; id: string; label: string; sub?: string; to: string };

export default function GlobalSearch() {
  const { t, locale } = useLanguage();
  const { committees, requests, tasks } = useData();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
      // Ctrl/Cmd + K → focus search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const hits = useMemo<Hit[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const results: Hit[] = [];

    for (const c of committees) {
      const blob = `${c.id} ${c.name} ${c.nameEn ?? ''} ${c.representative ?? ''} ${c.head ?? ''} ${c.organizer ?? ''}`.toLowerCase();
      if (blob.includes(term)) {
        results.push({
          kind: 'committee',
          id: c.id,
          label: committeeName(c, locale),
          sub: `${t('service.committees.title')} • ${c.id}`,
          to: '/app/committees',
        });
      }
      if (results.length >= 20) break;
    }
    for (const r of requests) {
      const blob = `${r.id} ${r.name} ${r.requester ?? ''} ${r.txnName ?? ''} ${r.owner ?? ''}`.toLowerCase();
      if (blob.includes(term)) {
        results.push({
          kind: 'request',
          id: r.id,
          label: r.name,
          sub: `${t('service.requests.title')} • ${r.id}`,
          to: '/app/requests',
        });
      }
      if (results.length >= 30) break;
    }
    for (const task of tasks) {
      const blob = `${task.id} ${task.title} ${task.team ?? ''} ${task.assignee ?? ''}`.toLowerCase();
      if (blob.includes(term)) {
        results.push({
          kind: 'task',
          id: task.id,
          label: task.title,
          sub: `${t('service.tasks.title')} • ${task.id}`,
          to: task.kind === 'routine' ? '/app/tasks/routine' : '/app/tasks/teams',
        });
      }
      if (results.length >= 40) break;
    }
    return results.slice(0, 20);
  }, [q, committees, requests, tasks, locale, t]);

  const groups = useMemo(() => {
    const grouped = { committee: [] as Hit[], request: [] as Hit[], task: [] as Hit[] };
    for (const h of hits) grouped[h.kind].push(h);
    return grouped;
  }, [hits]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={t('action.search')}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 ps-10 pe-16 py-2.5 text-sm focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none"
        aria-label={t('action.search')}
      />
      {!q && (
        <kbd
          className="hidden md:inline-flex absolute top-1/2 -translate-y-1/2 end-2 items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500 pointer-events-none"
          aria-hidden
        >
          ⌘K
        </kbd>
      )}
      {q && (
        <button
          type="button"
          onClick={() => {
            setQ('');
            setOpen(false);
          }}
          className="absolute top-1/2 -translate-y-1/2 end-2 rounded-md p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          aria-label="Clear"
        >
          <X size={14} />
        </button>
      )}

      {open && q.trim() && (
        <div className="absolute top-full inset-x-0 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-card p-2 animate-slide-up">
          {hits.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-slate-500">{t('common.empty')}</div>
          ) : (
            <>
              {groups.committee.length > 0 && <Group icon={Users} title={t('service.committees.title')} hits={groups.committee} onPick={() => setOpen(false)} />}
              {groups.request.length > 0 && <Group icon={Inbox} title={t('service.requests.title')} hits={groups.request} onPick={() => setOpen(false)} />}
              {groups.task.length > 0 && <Group icon={ListChecks} title={t('service.tasks.title')} hits={groups.task} onPick={() => setOpen(false)} />}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Group({
  icon: Icon,
  title,
  hits,
  onPick,
}: {
  icon: typeof Users;
  title: string;
  hits: Hit[];
  onPick: () => void;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Icon size={12} />
        {title}
      </div>
      <ul className="space-y-0.5">
        {hits.map((h) => (
          <li key={`${h.kind}-${h.id}`}>
            <Link
              to={h.to}
              onClick={onPick}
              className="flex items-start gap-3 rounded-xl px-2.5 py-2 hover:bg-brand-50/60 transition"
            >
              <span className="font-mono text-[10px] text-slate-400 mt-0.5 shrink-0">{h.id}</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-800 truncate">{h.label}</span>
                {h.sub && <span className="block text-[11px] text-slate-500 truncate">{h.sub}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
