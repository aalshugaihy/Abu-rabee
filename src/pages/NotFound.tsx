import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function NotFoundPage() {
  const { t, locale } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-7xl font-extrabold text-brand-700">404</div>
        <p className="mt-3 text-slate-600">{locale === 'ar' ? 'الصفحة غير موجودة' : 'Page not found'}</p>
        <Link to="/" className="btn-primary mt-6">{t('nav.home')}</Link>
      </div>
    </div>
  );
}
