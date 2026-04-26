import { useLanguage } from '../contexts/LanguageContext';

export default function Logo({ size = 'md', showText = true }: { size?: 'sm' | 'md' | 'lg'; showText?: boolean }) {
  const { t, locale } = useLanguage();
  const dim = size === 'sm' ? 28 : size === 'lg' ? 56 : 40;

  return (
    <div className="flex items-center gap-3">
      <div
        className="rounded-2xl flex items-center justify-center text-white shadow-soft"
        style={{
          width: dim,
          height: dim,
          background: 'linear-gradient(135deg, #34634d 0%, #467e62 60%, #669a7e 100%)',
        }}
        aria-hidden
      >
        <svg viewBox="0 0 64 64" width={dim * 0.62} height={dim * 0.62}>
          <path d="M14 44 L26 30 L34 38 L50 20" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="50" cy="20" r="3.5" fill="#e7a435" />
          <circle cx="14" cy="44" r="2.5" fill="#fff" />
        </svg>
      </div>
      {showText && (
        <div className="leading-tight">
          <div className={`font-extrabold text-slate-900 ${size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-base'}`}>
            {locale === 'ar' ? 'متابعة المهام' : 'Tasks Tracker'}
          </div>
          <div className="text-[11px] text-slate-500 hidden sm:block">{t('landing.heroBadge')}</div>
        </div>
      )}
    </div>
  );
}
