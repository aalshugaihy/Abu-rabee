import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/Landing';
import LoginPage from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/Dashboard';
import CommitteesPage from './pages/Committees';
import CommitteeDetail from './pages/CommitteeDetail';
import RequestsPage from './pages/Requests';
import RequestDetail from './pages/RequestDetail';
import TasksPage from './pages/Tasks';
import TasksBoard from './pages/TasksBoard';
import TaskDetail from './pages/TaskDetail';
import ReportsPage from './pages/Reports';
import CalendarPage from './pages/Calendar';
import ActivityPage from './pages/Activity';
import AdminPage from './pages/Admin';
import ProfilePage from './pages/Profile';
import SettingsPage from './pages/Settings';
import NotFoundPage from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="committees" element={<CommitteesPage />} />
        <Route path="committees/:id" element={<CommitteeDetail />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="requests/:id" element={<RequestDetail />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/board" element={<TasksBoard />} />
        <Route path="tasks/item/:id" element={<TaskDetail />} />
        <Route path="tasks/:tab" element={<TasksPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      </Route>
      <Route path="/dashboard" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
