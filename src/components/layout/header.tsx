import { useState } from 'react'
import { useNavigate } from 'react-router'
import { User, LogOut, Sun, Moon, Monitor, Plane, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppDispatch, useAppSelector } from '@/app/store'
import { logout } from '@/features/auth'
import { NotificationsDropdown } from '@/features/notifications'
import { useTheme } from '@/hooks'
import { GlobalSearch, SearchTrigger } from '@/components/global-search'
import { ConnectionStatus } from '@/components/connection-status'
import { KeyboardShortcutsDialog } from '@/components/keyboard-shortcuts'
import { cn } from '@/lib/utils'

interface HeaderProps {
  sidebarCollapsed: boolean
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { theme, setTheme } = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  // Extract name from email for display
  const emailPrefix = user?.email?.split('@')[0] || 'user'
  const displayName = emailPrefix.replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const displayEmail = user?.email || 'user@example.com'
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

  return (
    <>
      <header
        className={cn(
          'fixed top-0 right-0 z-30 flex h-14 md:h-16 items-center justify-between border-b bg-background px-4 md:px-6',
          'left-0 md:left-16',
          !sidebarCollapsed && 'md:left-64'
        )}
        style={{ transition: 'left 300ms' }}
      >
        {/* Mobile: Logo */}
        <div className="flex items-center gap-2 md:hidden">
          <Plane className="h-6 w-6 text-primary" />
          <span className="font-semibold">AMSS</span>
        </div>

        {/* Desktop: Search */}
        <div className="hidden md:block">
          <SearchTrigger onClick={() => setSearchOpen(true)} />
        </div>

        {/* Mobile: Search button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Right side actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Keyboard Shortcuts - hide on mobile */}
          <div className="hidden md:block">
            <KeyboardShortcutsDialog />
          </div>

          {/* Connection Status - hide on very small screens */}
          <div className="hidden sm:block">
            <ConnectionStatus />
          </div>

          {/* Theme Toggle - icon only on mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light
                {theme === 'light' && <span className="ml-auto text-primary">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
                {theme === 'dark' && <span className="ml-auto text-primary">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" />
                System
                {theme === 'system' && <span className="ml-auto text-primary">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <NotificationsDropdown />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {initials}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{displayName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {displayEmail}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
