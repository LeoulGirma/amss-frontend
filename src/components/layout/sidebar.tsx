import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Plane,
  Wrench,
  Calendar,
  Kanban,
  Users,
  Package,
  ShieldCheck,
  FileText,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { usePermissions } from '@/hooks'
import type { Permission } from '@/lib/rbac'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: Permission
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    permission: 'view:dashboard',
  },
  {
    title: 'Fleet',
    href: '/fleet',
    icon: Plane,
    permission: 'view:fleet',
  },
  {
    title: 'Maintenance',
    href: '/maintenance',
    icon: Wrench,
    permission: 'view:maintenance',
  },
  {
    title: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    permission: 'view:maintenance',
  },
  {
    title: 'Kanban',
    href: '/kanban',
    icon: Kanban,
    permission: 'view:maintenance',
  },
  {
    title: 'Team',
    href: '/team',
    icon: Users,
    permission: 'view:team',
  },
  {
    title: 'Parts',
    href: '/parts',
    icon: Package,
    permission: 'view:parts',
  },
  {
    title: 'Compliance',
    href: '/compliance',
    icon: ShieldCheck,
    permission: 'view:compliance',
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: FileText,
    permission: 'view:reports',
  },
  {
    title: 'Audit Log',
    href: '/audit',
    icon: History,
    permission: 'view:compliance',
  },
]

const bottomNavItems: NavItem[] = [
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    permission: 'view:settings',
  },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { can } = usePermissions()

  // Filter nav items based on user permissions
  const visibleNavItems = navItems.filter(
    (item) => !item.permission || can(item.permission)
  )
  const visibleBottomNavItems = bottomNavItems.filter(
    (item) => !item.permission || can(item.permission)
  )

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-slow',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Plane className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">AMSS</span>
            </div>
          )}
          {collapsed && <Plane className="h-6 w-6 text-primary mx-auto" />}
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', collapsed && 'absolute -right-3 top-6 rounded-full border bg-background shadow-sm')}
            onClick={onToggle}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground',
                  collapsed && 'justify-center px-2'
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>

        <Separator />

        {/* Bottom Navigation */}
        <nav className="p-2">
          {visibleBottomNavItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground',
                  collapsed && 'justify-center px-2'
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}
