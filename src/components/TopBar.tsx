import { Link } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import Logo from './Logo';
import LanguageSwitch from './LanguageSwitch';
import { useLanguage } from '../contexts/LanguageContext';
import { useUI } from '../contexts/UIContext';
import GlobalSearch from './GlobalSearch';

export default function TopBar() {
  const { t } = useLanguage();
  const { toggleMobileNav } = useUI();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 glass">
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
          <LanguageSwitch variant="ghost" />
          <button type="button" className="relative rounded-xl p-2.5 text-slate-600 hover:bg-slate-100" aria-label="Notifications">
            <Bell size={18} />
            <span className="absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-rose-500" />
          </button>
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-1.5">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-bold flex items-center justify-center">AR</div>
            <div className="leading-tight">
              <div className="text-xs font-semibold text-slate-900">أبو ربيع</div>
              <div className="text-[10px] text-slate-500">{t('landing.heroBadge')}</div>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile search row */}
      <div className="md:hidden px-3 pb-3">
        <GlobalSearch />
      </div>
    </header>
  );
}
