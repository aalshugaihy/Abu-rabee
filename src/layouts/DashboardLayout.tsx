import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getSocket } from '../lib/socket';

export default function DashboardLayout() {
  const { apiAvailable } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (!apiAvailable) return;
    const socket = getSocket();
    const off = socket.onChange(() => {
      toast.info(t('realtime.refreshed'));
    });
    return off;
  }, [apiAvailable, toast, t]);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
