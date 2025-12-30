import { createBrowserRouter } from 'react-router'
import { MainLayout } from '@/components/layout'
import { LoginPage, ProtectedRoute } from '@/features/auth'
import { DashboardPage } from '@/features/dashboard'
import { FleetPage } from '@/features/fleet'
import { MaintenancePage, CalendarPage, KanbanBoard } from '@/features/maintenance'
import { TeamPage } from '@/features/team'
import { PartsPage } from '@/features/parts'
import { CompliancePage } from '@/features/compliance'
import { ReportsPage } from '@/features/reports'
import { SettingsPage } from '@/features/settings'
import { AuditPage } from '@/features/audit'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'fleet',
        element: <FleetPage />,
      },
      {
        path: 'maintenance',
        element: <MaintenancePage />,
      },
      {
        path: 'calendar',
        element: <CalendarPage />,
      },
      {
        path: 'kanban',
        element: <KanbanBoard />,
      },
      {
        path: 'team',
        element: <TeamPage />,
      },
      {
        path: 'parts',
        element: <PartsPage />,
      },
      {
        path: 'compliance',
        element: <CompliancePage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'audit',
        element: <AuditPage />,
      },
    ],
  },
])
