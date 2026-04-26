import { FormEvent, useEffect, useState } from 'react';
import { Save, KeyRound, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import PageHeader from '../components/PageHeader';
import { api } from '../lib/api';
import { AuthUser } from '../data/types';

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user, apiAvailable } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name ?? '');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  if (!apiAvailable) {
    return (
      <div>
        <PageHeader title={t('profile.title')} subtitle={t('auth.workingOffline')} />
        <p className="text-sm text-slate-500">{t('auth.workingOffline')}</p>
      </div>
    );
  }
  if (!user) return null;

  async function saveName(e: FormEvent) {
    e.preventDefault();
    setSavingName(true);
    try {
      await api.patch<AuthUser>('/api/auth/me', { name });
      toast.success(t('auth.profileSaved'));
    } catch {
      toast.error('!');
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setPwdError(null);
    setSavingPwd(true);
    try {
      await api.post('/api/auth/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast.success(t('auth.passwordChanged'));
    } catch (err) {
      setPwdError((err as Error).message === 'invalid_password' ? t('auth.invalidPassword') : '!');
    } finally {
      setSavingPwd(false);
    }
  }

  return (
    <div>
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={saveName} className="card p-6">
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <User size={16} className="text-brand-700" /> {t('profile.section.info')}
          </h2>
          <p className="text-xs text-slate-500 mb-4 font-mono">{user.email} · {t(`auth.role.${user.role}` as const)}</p>
          <label className="label">{t('auth.name')}</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="mt-4 flex justify-end">
            <button type="submit" className="btn-primary" disabled={savingName || !name.trim() || name === user.name}>
              <Save size={14} /> {t('action.save')}
            </button>
          </div>
        </form>

        <form onSubmit={savePassword} className="card p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <KeyRound size={16} className="text-brand-700" /> {t('profile.section.security')}
          </h2>
          <label className="label">{t('auth.currentPassword')}</label>
          <input
            type="password"
            className="input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <label className="label mt-3">{t('auth.newPassword')}</label>
          <input
            type="password"
            className="input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          {pwdError && <p className="mt-2 text-xs font-semibold text-rose-600">{pwdError}</p>}
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="btn-primary"
              disabled={savingPwd || !currentPassword || newPassword.length < 8}
            >
              <Save size={14} /> {t('auth.changePassword')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
