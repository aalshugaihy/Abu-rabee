import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Users,
  Inbox,
  ListChecks,
  BarChart3,
  ShieldCheck,
  Globe2,
  Sparkles,
  Activity,
  Wrench,
  UsersRound,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import LanguageSwitch from '../components/LanguageSwitch';
import Logo from '../components/Logo';

export default function LandingPage() {
  const { t, dir, locale } = useLanguage();
  const { committees, requests, tasks } = useData();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const stats = [
    { value: committees.length, label: t('landing.statCommittees'), icon: Users },
    { value: requests.length, label: t('landing.statRequests'), icon: Inbox },
    { value: tasks.filter((x) => x.status === 'inProgress').length, label: t('landing.statTasks'), icon: Activity },
    { value: 5, label: t('landing.statSectors'), icon: Globe2 },
  ];

  const services = [
    {
      to: '/app/committees',
      icon: Users,
      title: t('service.committees.title'),
      desc: t('service.committees.desc'),
      tone: 'from-brand-500 to-brand-700',
    },
    {
      to: '/app/requests',
      icon: Inbox,
      title: t('service.requests.title'),
      desc: t('service.requests.desc'),
      tone: 'from-sky-500 to-blue-700',
    },
    {
      to: '/app/tasks',
      icon: ListChecks,
      title: t('service.tasks.title'),
      desc: t('service.tasks.desc'),
      tone: 'from-amber-500 to-orange-600',
    },
    {
      to: '/app/reports',
      icon: BarChart3,
      title: t('service.reports.title'),
      desc: t('service.reports.desc'),
      tone: 'from-violet-500 to-fuchsia-600',
    },
  ];

  const features = [
    { icon: ShieldCheck, title: t('landing.feature1.title'), desc: t('landing.feature1.desc') },
    { icon: Globe2, title: t('landing.feature2.title'), desc: t('landing.feature2.desc') },
    { icon: BarChart3, title: t('landing.feature3.title'), desc: t('landing.feature3.desc') },
    { icon: Sparkles, title: t('landing.feature4.title'), desc: t('landing.feature4.desc') },
  ];

  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <header className="absolute top-0 inset-x-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-5">
          <Logo />
          <div className="flex items-center gap-2">
            <LanguageSwitch variant="light" />
            <Link to="/app" className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2 text-sm font-bold text-brand-700 hover:bg-white">
              {t('action.start')}
              <Arrow size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden text-white">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(120% 80% at 50% -10%, #467e62 0%, #34634d 35%, #1f352c 75%, #0f1d18 100%)',
          }}
        />
        <div
          className="absolute inset-0 -z-10 opacity-30 mix-blend-screen"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><path d='M0 20h40M20 0v40' stroke='%23ffffff' stroke-width='0.4' opacity='0.5'/></svg>\")",
          }}
        />
        <div className="absolute -top-40 -end-40 h-[420px] w-[420px] rounded-full bg-accent-400/30 blur-3xl -z-10" />
        <div className="absolute -bottom-40 -start-40 h-[420px] w-[420px] rounded-full bg-brand-300/30 blur-3xl -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-20 sm:pt-40 sm:pb-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-semibold border border-white/20">
              <Sparkles size={14} />
              {t('landing.heroBadge')}
            </span>
            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight text-balance">
              {t('landing.heroTitle')}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-white/80 leading-relaxed text-balance">
              {t('landing.heroDescription')}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/app" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-800 hover:bg-accent-50 shadow-card">
                {t('action.start')}
                <Arrow size={16} />
              </Link>
              <a href="#services" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 backdrop-blur px-5 py-3 text-sm font-bold text-white hover:bg-white/20">
                {t('action.explore')}
              </a>
            </div>
          </div>

          {/* KPI strip */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold">{value}</div>
                    <div className="text-xs sm:text-sm text-white/75">{label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-bold">
            {t('nav.services')}
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">{t('landing.servicesTitle')}</h2>
          <p className="mt-2 text-slate-600 max-w-2xl mx-auto">{t('landing.servicesSubtitle')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map(({ to, icon: Icon, title, desc, tone }) => (
            <Link
              key={to}
              to={to}
              className="group relative overflow-hidden card p-6 hover:shadow-card transition hover:-translate-y-0.5"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone}`} />
              <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${tone} text-white flex items-center justify-center shadow-soft`}>
                <Icon size={22} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{desc}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 group-hover:gap-2.5 transition-all">
                {t('action.openService')}
                <Arrow size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Tasks split highlight */}
      <section className="bg-gradient-to-br from-brand-50 via-slate-50 to-amber-50/40 border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card p-7 relative overflow-hidden">
              <div className="absolute -top-12 -end-12 h-40 w-40 rounded-full bg-amber-100/70 blur-2xl" />
              <Wrench size={28} className="text-amber-600" />
              <h3 className="mt-3 text-xl font-extrabold text-slate-900">{t('nav.tasks.routine')}</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">{t('tasks.routine.intro')}</p>
              <Link to="/app/tasks/routine" className="btn-secondary mt-5">
                {t('action.openService')} <Arrow size={14} />
              </Link>
            </div>
            <div className="card p-7 relative overflow-hidden">
              <div className="absolute -top-12 -end-12 h-40 w-40 rounded-full bg-brand-100/70 blur-2xl" />
              <UsersRound size={28} className="text-brand-700" />
              <h3 className="mt-3 text-xl font-extrabold text-slate-900">{t('nav.tasks.teams')}</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">{t('tasks.teams.intro')}</p>
              <Link to="/app/tasks/teams" className="btn-primary mt-5">
                {t('action.openService')} <Arrow size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('landing.featuresTitle')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6">
              <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                <Icon size={20} />
              </div>
              <h4 className="mt-4 text-base font-bold text-slate-900">{title}</h4>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div
          className="rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1f352c 0%, #34634d 60%, #467e62 100%)' }}
        >
          <div className="absolute -top-20 -end-20 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold">{t('app.tagline')}</h3>
              <p className="mt-2 text-white/75">{locale === 'ar' ? 'ابدأ الآن واكتشف لوحة الخدمات الكاملة.' : 'Get started now and explore the full services panel.'}</p>
            </div>
            <Link to="/app" className="self-start md:self-auto inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-800 hover:bg-accent-50">
              {t('action.start')}
              <Arrow size={16} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>{t('app.copyright')}</span>
          <span>{t('app.name')}</span>
        </div>
      </footer>
    </div>
  );
}
