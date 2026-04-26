import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/Landing';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/Dashboard';
import CommitteesPage from './pages/Committees';
import RequestsPage from './pages/Requests';
import TasksPage from './pages/Tasks';
import ReportsPage from './pages/Reports';
import SettingsPage from './pages/Settings';
import NotFoundPage from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="committees" element={<CommitteesPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/:tab" element={<TasksPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="/dashboard" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
