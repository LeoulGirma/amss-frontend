import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router'
import { MainLayout } from '@/components/layout'
import { ProtectedRoute } from '@/features/auth'
import { PageSkeleton } from '@/components/loading-states'

// Lazy-loaded page components for code splitting
const LoginPage = lazy(() => import('@/features/auth/login-page').then(m => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/dashboard-page').then(m => ({ default: m.DashboardPage })))
const FleetPage = lazy(() => import('@/features/fleet/fleet-page').then(m => ({ default: m.FleetPage })))
const MaintenancePage = lazy(() => import('@/features/maintenance/maintenance-page').then(m => ({ default: m.MaintenancePage })))
const CalendarPage = lazy(() => import('@/features/maintenance/calendar-page').then(m => ({ default: m.CalendarPage })))
const KanbanBoard = lazy(() => import('@/features/maintenance/kanban-board').then(m => ({ default: m.KanbanBoard })))
const TeamPage = lazy(() => import('@/features/team/team-page').then(m => ({ default: m.TeamPage })))
const PartsPage = lazy(() => import('@/features/parts/parts-page').then(m => ({ default: m.PartsPage })))
const CompliancePage = lazy(() => import('@/features/compliance/compliance-page').then(m => ({ default: m.CompliancePage })))
const ReportsPage = lazy(() => import('@/features/reports/reports-page').then(m => ({ default: m.ReportsPage })))
const SettingsPage = lazy(() => import('@/features/settings/settings-page').then(m => ({ default: m.SettingsPage })))
const AuditPage = lazy(() => import('@/features/audit/audit-page').then(m => ({ default: m.AuditPage })))
const NotificationsPage = lazy(() => import('@/features/notifications/notifications-page').then(m => ({ default: m.NotificationsPage })))
const ProfilePage = lazy(() => import('@/features/profile/profile-page').then(m => ({ default: m.ProfilePage })))

// Wrapper component for lazy-loaded routes
const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageSkeleton />}>
    {children}
  </Suspense>
)

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LazyRoute><LoginPage /></LazyRoute>,
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
        element: <LazyRoute><DashboardPage /></LazyRoute>,
      },
      {
        path: 'fleet',
        element: <LazyRoute><FleetPage /></LazyRoute>,
      },
      {
        path: 'maintenance',
        element: <LazyRoute><MaintenancePage /></LazyRoute>,
      },
      {
        path: 'calendar',
        element: <LazyRoute><CalendarPage /></LazyRoute>,
      },
      {
        path: 'kanban',
        element: <LazyRoute><KanbanBoard /></LazyRoute>,
      },
      {
        path: 'team',
        element: <LazyRoute><TeamPage /></LazyRoute>,
      },
      {
        path: 'parts',
        element: <LazyRoute><PartsPage /></LazyRoute>,
      },
      {
        path: 'compliance',
        element: <LazyRoute><CompliancePage /></LazyRoute>,
      },
      {
        path: 'reports',
        element: <LazyRoute><ReportsPage /></LazyRoute>,
      },
      {
        path: 'settings',
        element: <LazyRoute><SettingsPage /></LazyRoute>,
      },
      {
        path: 'audit',
        element: <LazyRoute><AuditPage /></LazyRoute>,
      },
      {
        path: 'notifications',
        element: <LazyRoute><NotificationsPage /></LazyRoute>,
      },
      {
        path: 'profile',
        element: <LazyRoute><ProfilePage /></LazyRoute>,
      },
    ],
  },
])
