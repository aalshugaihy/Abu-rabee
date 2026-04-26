import { useEffect, useState } from 'react';
import { ShieldCheck, Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { api } from '../lib/api';
import { Role } from '../data/types';
import { formatDateTime } from '../lib/datetime';

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
};

export default function AdminPage() {
  const { t } = useLanguage();
  const { user, apiAvailable } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!apiAvailable || user?.role !== 'admin') return;
    setLoading(true);
    api
      .get<AdminUser[]>('/api/auth/users')
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [apiAvailable, user?.role]);

  if (!apiAvailable) {
    return (
      <div>
        <PageHeader title={t('admin.title')} subtitle={t('auth.workingOffline')} />
        <div className="card"><EmptyState title={t('auth.workingOffline')} /></div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div>
        <PageHeader title={t('admin.title')} />
        <div className="card p-10 text-center">
          <ShieldCheck size={36} className="mx-auto text-rose-500 mb-3" />
          <p className="text-slate-600 font-semibold">{t('auth.forbiddenWrite')}</p>
        </div>
      </div>
    );
  }

  async function changeRole(id: string, role: Role) {
    try {
      const updated = await api.patch<AdminUser>(`/api/auth/users/${id}/role`, { role });
      setUsers((prev) => (prev ? prev.map((u) => (u.id === id ? { ...u, role: updated.role } : u)) : prev));
      toast.success(t('action.save') + ' ✓');
    } catch {
      toast.error('!');
    }
  }

  return (
    <div>
      <PageHeader title={t('admin.title')} subtitle={t('admin.subtitle')} />

      {loading && <p className="text-sm text-slate-500">{t('common.loading')}</p>}

      {users && users.length === 0 && (
        <div className="card"><EmptyState title={t('common.empty')} /></div>
      )}

      {users && users.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th><Users size={14} className="inline -mt-0.5 me-1" /> {t('auth.name')}</th>
                <th>{t('auth.email')}</th>
                <th>{t('auth.role')}</th>
                <th>{t('detail.createdAt')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-semibold text-slate-800">{u.name}</td>
                  <td className="text-slate-700">{u.email}</td>
                  <td>
                    <span className={`badge ${
                      u.role === 'admin' ? 'bg-rose-50 text-rose-700' :
                      u.role === 'staff' ? 'bg-sky-50 text-sky-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {t(`auth.role.${u.role}` as const)}
                    </span>
                  </td>
                  <td className="text-xs text-slate-500">{formatDateTime(u.createdAt)}</td>
                  <td className="text-end">
                    <select
                      className="select"
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value as Role)}
                      disabled={u.id === user.id}
                      aria-label={t('auth.role')}
                    >
                      <option value="admin">{t('auth.role.admin')}</option>
                      <option value="staff">{t('auth.role.staff')}</option>
                      <option value="viewer">{t('auth.role.viewer')}</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
