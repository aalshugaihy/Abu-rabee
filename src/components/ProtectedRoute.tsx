import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Gates routes behind authentication when a backend is configured. In
 * localStorage mode (no VITE_API_URL) authentication is bypassed entirely
 * so the offline experience continues to work.
 */
export default function ProtectedRoute() {
  const { ready, apiAvailable, user } = useAuth();
  const location = useLocation();

  if (!apiAvailable) return <Outlet />;
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">…</div>
    );
  }
  if (!user) {
    const params = new URLSearchParams({ next: location.pathname + location.search });
    return <Navigate to={`/login?${params.toString()}`} replace />;
  }
  return <Outlet />;
}
