import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import PageHeader from '../components/PageHeader';
import LanguageSwitch from '../components/LanguageSwitch';
import { RotateCcw } from 'lucide-react';

export default function SettingsPage() {
  const { t, locale } = useLanguage();
  const { resetAll } = useData();

  return (
    <div>
      <PageHeader title={t('nav.settings')} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-base font-bold text-slate-900">{t('common.lang')}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {locale === 'ar' ? 'يدعم النظام العربية والإنجليزية مع تبديل اتجاه الصفحة تلقائياً.' : 'The system supports Arabic and English with automatic RTL/LTR switching.'}
          </p>
          <div className="mt-4">
            <LanguageSwitch />
          </div>
        </div>
        <div className="card p-6">
          <h3 className="text-base font-bold text-slate-900">{locale === 'ar' ? 'البيانات' : 'Data'}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {locale === 'ar' ? 'إعادة تعيين البيانات إلى الحالة الافتراضية المستندة إلى ملفات إكسل.' : 'Reset data back to the seeded defaults from the Excel files.'}
          </p>
          <button
            type="button"
            className="btn-secondary mt-4"
            onClick={() => {
              if (confirm(locale === 'ar' ? 'إعادة تعيين البيانات؟' : 'Reset data?')) resetAll();
            }}
          >
            <RotateCcw size={14} /> {locale === 'ar' ? 'إعادة التعيين' : 'Reset'}
          </button>
        </div>
      </div>
    </div>
  );
}
