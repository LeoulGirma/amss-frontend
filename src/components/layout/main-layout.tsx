import { useState } from 'react'
import { Outlet } from 'react-router'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { MobileNav } from '@/components/mobile-nav'
import { cn } from '@/lib/utils'

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      <Header sidebarCollapsed={sidebarCollapsed} />

      <main
        className={cn(
          'pt-16 transition-all duration-slow',
          // Desktop: add left padding for sidebar
          'md:pl-16',
          !sidebarCollapsed && 'md:pl-64',
          // Mobile: add bottom padding for bottom nav
          'pb-20 md:pb-0'
        )}
      >
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  )
}
