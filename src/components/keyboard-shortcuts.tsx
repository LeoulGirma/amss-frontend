import { useState, useEffect, useCallback } from 'react'
import { Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

interface Shortcut {
  keys: string[]
  description: string
  action?: () => void
}

interface ShortcutGroup {
  title: string
  shortcuts: Shortcut[]
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

const modKey = isMac ? '⌘' : 'Ctrl'

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: [modKey, 'K'], description: 'Open global search' },
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'F'], description: 'Go to Fleet' },
      { keys: ['G', 'M'], description: 'Go to Maintenance' },
      { keys: ['G', 'C'], description: 'Go to Calendar' },
      { keys: ['G', 'P'], description: 'Go to Parts' },
      { keys: ['G', 'T'], description: 'Go to Team' },
      { keys: ['G', 'S'], description: 'Go to Settings' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: [modKey, 'N'], description: 'Create new task' },
      { keys: [modKey, 'S'], description: 'Save current form' },
      { keys: [modKey, 'Enter'], description: 'Submit form' },
      { keys: ['Escape'], description: 'Close dialog / Cancel' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { keys: [modKey, 'B'], description: 'Toggle sidebar' },
      { keys: [modKey, '/'], description: 'Show keyboard shortcuts' },
      { keys: [modKey, '.'], description: 'Toggle theme' },
    ],
  },
  {
    title: 'Tables & Lists',
    shortcuts: [
      { keys: ['J'], description: 'Move down' },
      { keys: ['K'], description: 'Move up' },
      { keys: ['Enter'], description: 'Open selected item' },
      { keys: ['E'], description: 'Edit selected item' },
      { keys: ['Delete'], description: 'Delete selected item' },
    ],
  },
]

function ShortcutKey({ children }: { children: string }) {
  return (
    <kbd className="px-2 py-1 text-xs font-semibold bg-muted border rounded-md min-w-[24px] text-center">
      {children}
    </kbd>
  )
}

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false)

  // Listen for Cmd/Ctrl + / to open shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          <span className="hidden md:inline">Shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and perform actions quickly
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {shortcutGroups.map((group, groupIndex) => (
            <div key={group.title}>
              {groupIndex > 0 && <Separator className="mb-4" />}
              <h3 className="font-semibold text-sm mb-3">{group.title}</h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <ShortcutKey>{key}</ShortcutKey>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
          <span>Press</span>
          <ShortcutKey>{modKey}</ShortcutKey>
          <span>+</span>
          <ShortcutKey>/</ShortcutKey>
          <span>to toggle this dialog</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Global keyboard shortcuts hook
export function useKeyboardShortcuts() {
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  const handleNavigation = useCallback((path: string) => {
    window.location.href = path
  }, [])

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      // Handle "G" prefix shortcuts
      if (pendingKey === 'g') {
        clearTimeout(timeout)
        setPendingKey(null)

        switch (e.key.toLowerCase()) {
          case 'd':
            e.preventDefault()
            handleNavigation('/')
            break
          case 'f':
            e.preventDefault()
            handleNavigation('/fleet')
            break
          case 'm':
            e.preventDefault()
            handleNavigation('/maintenance')
            break
          case 'c':
            e.preventDefault()
            handleNavigation('/calendar')
            break
          case 'p':
            e.preventDefault()
            handleNavigation('/parts')
            break
          case 't':
            e.preventDefault()
            handleNavigation('/team')
            break
          case 's':
            e.preventDefault()
            handleNavigation('/settings')
            break
        }
        return
      }

      // Start "G" prefix
      if (e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey) {
        setPendingKey('g')
        timeout = setTimeout(() => setPendingKey(null), 1000)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timeout)
    }
  }, [pendingKey, handleNavigation])

  return { pendingKey }
}

// Visual indicator for pending key
export function PendingKeyIndicator() {
  const { pendingKey } = useKeyboardShortcuts()

  if (!pendingKey) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg animate-in fade-in zoom-in text-sm font-medium">
      Press next key...
      <kbd className="ml-2 px-2 py-0.5 bg-primary-foreground/20 rounded text-xs">
        {pendingKey.toUpperCase()}
      </kbd>
    </div>
  )
}
