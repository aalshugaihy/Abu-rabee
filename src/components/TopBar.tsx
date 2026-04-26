import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import Logo from './Logo';
import LanguageSwitch from './LanguageSwitch';
import { useLanguage } from '../contexts/LanguageContext';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import GlobalSearch from './GlobalSearch';
import NotificationsPanel from './NotificationsPanel';
import { getSocket, type SocketHandle } from '../lib/socket';

export default function TopBar() {
  const { t } = useLanguage();
  const { toggleMobileNav } = useUI();
  const { user, apiAvailable, logout } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<SocketHandle['status']>('disconnected');
  useEffect(() => {
    if (!apiAvailable) return;
    const socket = getSocket();
    setStatus(socket.status);
    const off = socket.onStatus(setStatus);
    return off;
  }, [apiAvailable]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 glass print:hidden">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-3 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMobileNav}
            className="lg:hidden rounded-xl p-2.5 text-slate-600 hover:bg-slate-100"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <Link to="/app" className="flex items-center gap-3">
            <Logo />
          </Link>
        </div>
        <div className="hidden md:flex flex-1 max-w-xl">
          <GlobalSearch />
        </div>
        <div className="flex items-center gap-2">
          {apiAvailable && (
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                status === 'connected' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}
              title={`API: ${apiAvailable ? 'connected' : 'offline'}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${status === 'connected' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {status === 'connected' ? t('realtime.connected') : t('realtime.disconnected')}
            </span>
          )}
          <LanguageSwitch variant="ghost" />
          <NotificationsPanel />
          {apiAvailable && user ? (
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-bold flex items-center justify-center">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold text-slate-900">{user.name}</div>
                <div className="text-[10px] text-slate-500">
                  {t(`auth.role.${user.role}` as const)}
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                className="rounded-lg p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                aria-label={t('auth.logout')}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-1.5">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-bold flex items-center justify-center">AR</div>
              <div className="leading-tight">
                <div className="text-xs font-semibold text-slate-900">أبو ربيع</div>
                <div className="text-[10px] text-slate-500">{t('landing.heroBadge')}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="md:hidden px-3 pb-3">
        <GlobalSearch />
      </div>
    </header>
  );
}
