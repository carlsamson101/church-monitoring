import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ToastProvider } from './components/common/Toast'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Login, Register, ForgotPassword, ResetPassword } from './components/auth/AuthPages'
import AppLayout from './components/layouts/AppLayout'
import Dashboard from './components/dashboard/Dashboard'
import CellGroupsPage from './components/cell-groups/CellGroupsPage'
import LeadersPage from './components/leaders/LeadersPage'
import DisciplesPage from './components/disciples/DisciplesPage'
import DiscipleProfile from './components/disciples/DiscipleProfile'
import InviteesPage from './components/invitees/InviteesPage'
import EventsPage from './components/events/EventsPage'
import AttendancePage from './components/attendance/AttendancePage'
import DeveloperPage from './components/developer/DeveloperPage'
import ChecklistAdminPage from './components/checklists/ChecklistAdminPage'
import RecordChecklistPage from './components/checklists/RecordChecklistPage'
import MonitoringPage from './components/monitoring/MonitoringPage'
import ReportsPage from './components/reports/ReportsPage'
import ComingSoon from './components/common/ComingSoon'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="cell-groups" element={<CellGroupsPage />} />
                <Route path="disciples" element={<DisciplesPage />} />
                <Route path="disciples/:id" element={<DiscipleProfile />} />
                <Route path="monitoring" element={<MonitoringPage />} />
                <Route path="record" element={<RecordChecklistPage />} />
                <Route path="invitees" element={<InviteesPage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="events/:id" element={<AttendancePage />} />
                <Route element={<ProtectedRoute roles={['developer', 'pastor']} />}>
                  <Route path="leaders" element={<LeadersPage />} />
                  <Route path="checklists" element={<ChecklistAdminPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                </Route>
                <Route element={<ProtectedRoute roles={['developer']} />}>
                  <Route path="developer" element={<DeveloperPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
