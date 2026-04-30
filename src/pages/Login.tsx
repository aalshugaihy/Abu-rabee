import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitch from '../components/LanguageSwitch';
import Logo from '../components/Logo';

export default function LoginPage() {
  const { t, dir } = useLanguage();
  const { login, register: registerFn, apiAvailable } = useAuth();
  const navigate = useNavigate();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [waking, setWaking] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // Render's free tier sleeps after 15 min idle. Surface a "waking up"
    // hint if the request hasn't returned in 4s so users don't think the
    // form is broken on the first cold-start hit.
    const wakeTimer = window.setTimeout(() => setWaking(true), 4000);
    try {
      if (mode === 'login') {
        await login(email, password, rememberMe);
      } else {
        await registerFn({ email, password, name, rememberMe });
      }
      navigate('/app');
    } catch (err) {
      setError(t('auth.failed'));
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      clearTimeout(wakeTimer);
      setWaking(false);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: 'radial-gradient(120% 80% at 50% -10%, #467e62 0%, #34634d 35%, #1f352c 75%, #0f1d18 100%)',
        }}
      />
      <div className="absolute -top-40 -end-40 h-[420px] w-[420px] rounded-full bg-accent-400/30 blur-3xl -z-10" />
      <header className="absolute top-0 inset-x-0 z-10">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-5 text-white">
          <Link to="/" className="text-white">
            <Logo />
          </Link>
          <LanguageSwitch variant="light" />
        </div>
      </header>

      <main className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md card p-7">
          <h1 className="text-2xl font-extrabold text-slate-900">
            {mode === 'login' ? t('auth.login') : t('action.addNew')}
          </h1>
          {!apiAvailable && (
            <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
              {t('auth.workingOffline')}
            </p>
          )}

          <form onSubmit={submit} className="mt-5 space-y-3">
            {mode === 'register' && (
              <div>
                <label className="label">{t('auth.name')}</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <label className="label">{t('auth.email')}</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="label">{t('auth.password')}</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={mode === 'register' ? 8 : 1}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded"
              />
              {t('auth.rememberMe')}
            </label>
            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
            {waking && (
              <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                {t('auth.waking')}
              </p>
            )}
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading || !apiAvailable}>
              <LogIn size={14} /> {mode === 'login' ? t('auth.signIn') : t('action.save')}
              <Arrow size={14} />
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-600">
            <button
              type="button"
              onClick={() => setMode((m) => (m === 'login' ? 'register' : 'login'))}
              className="font-bold text-brand-700 hover:underline"
            >
              {mode === 'login' ? t('action.addNew') : t('auth.signIn')}
            </button>
          </div>

          {apiAvailable && (
            <details className="mt-5 text-xs text-slate-600 rounded-xl bg-slate-50 border border-slate-200 p-3">
              <summary className="font-bold cursor-pointer">{t('auth.demo')}</summary>
              <ul className="mt-2 space-y-1 font-mono">
                <li>admin@aburabee.gov · admin1234</li>
                <li>staff@aburabee.gov · staff1234</li>
                <li>viewer@aburabee.gov · viewer1234</li>
              </ul>
            </details>
          )}
        </div>
      </main>
    </div>
  );
}
