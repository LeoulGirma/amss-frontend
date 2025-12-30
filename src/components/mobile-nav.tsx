import { NavLink, useLocation } from 'react-router'
import {
  LayoutDashboard,
  Plane,
  Wrench,
  Package,
  MoreHorizontal,
  Calendar,
  Kanban,
  Users,
  ShieldCheck,
  FileText,
  History,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

const primaryNavItems = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Fleet', href: '/fleet', icon: Plane },
  { title: 'Tasks', href: '/maintenance', icon: Wrench },
  { title: 'Parts', href: '/parts', icon: Package },
]

const moreNavItems = [
  { title: 'Calendar', href: '/calendar', icon: Calendar },
  { title: 'Kanban', href: '/kanban', icon: Kanban },
  { title: 'Team', href: '/team', icon: Users },
  { title: 'Compliance', href: '/compliance', icon: ShieldCheck },
  { title: 'Reports', href: '/reports', icon: FileText },
  { title: 'Audit Log', href: '/audit', icon: History },
  { title: 'Settings', href: '/settings', icon: Settings },
]

export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()

  const isMoreActive = moreNavItems.some((item) => item.href === location.pathname)

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.title}</span>
            </NavLink>
          ))}

          {/* More Button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]',
              isMoreActive
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>

        {/* Safe area padding for devices with home indicator */}
        <div className="h-safe-area-inset-bottom bg-background" />
      </nav>

      {/* More Menu Sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[70vh]">
          <SheetHeader className="pb-4">
            <SheetTitle>More Options</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 pb-6">
            {moreNavItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )
                }
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs font-medium text-center">{item.title}</span>
              </NavLink>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

// Floating Action Button for quick actions
interface FloatingActionButtonProps {
  icon: React.ReactNode
  onClick: () => void
  label: string
}

export function FloatingActionButton({ icon, onClick, label }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40 md:hidden flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-transform"
      aria-label={label}
    >
      {icon}
    </button>
  )
}
