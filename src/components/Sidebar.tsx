import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Inbox,
  ListChecks,
  BarChart3,
  Settings,
  Wrench,
  UsersRound,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';

type Item = {
  to: string;
  labelKey: 'nav.dashboard' | 'nav.committees' | 'nav.requests' | 'nav.tasks' | 'nav.tasks.routine' | 'nav.tasks.teams' | 'nav.reports' | 'nav.settings';
  icon: LucideIcon;
  end?: boolean;
};

const items: Item[] = [
  { to: '/app', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/committees', labelKey: 'nav.committees', icon: Users },
  { to: '/app/requests', labelKey: 'nav.requests', icon: Inbox },
  { to: '/app/tasks', labelKey: 'nav.tasks', icon: ListChecks },
  { to: '/app/tasks/routine', labelKey: 'nav.tasks.routine', icon: Wrench },
  { to: '/app/tasks/teams', labelKey: 'nav.tasks.teams', icon: UsersRound },
  { to: '/app/reports', labelKey: 'nav.reports', icon: BarChart3 },
  { to: '/app/settings', labelKey: 'nav.settings', icon: Settings },
];

export default function Sidebar() {
  const { t, dir } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const Chev = dir === 'rtl' ? (collapsed ? ChevronLeft : ChevronRight) : collapsed ? ChevronRight : ChevronLeft;

  return (
    <aside
      className={`hidden lg:flex shrink-0 sticky top-[65px] self-start h-[calc(100vh-65px)] flex-col border-s border-slate-200 bg-white/70 glass transition-all duration-200 ${
        collapsed ? 'w-[72px]' : 'w-72'
      }`}
    >
      <div className="px-3 pt-4 pb-2 flex items-center justify-between">
        {!collapsed && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
            {t('nav.services')}
          </span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          aria-label="Toggle sidebar"
        >
          <Chev size={16} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {items.map(({ to, labelKey, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-brand-600 text-white shadow-soft' : 'text-slate-700 hover:bg-slate-100'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <Icon size={18} />
            {!collapsed && <span className="truncate">{t(labelKey)}</span>}
          </NavLink>
        ))}
      </nav>
      {!collapsed && (
        <div className="mx-3 mb-4 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white p-4">
          <div className="text-xs font-bold opacity-80">{t('app.short')}</div>
          <div className="mt-1 text-sm font-bold leading-snug">{t('app.tagline')}</div>
        </div>
      )}
    </aside>
  );
}
