import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import {
  Search,
  Plane,
  Wrench,
  Package,
  Users,
  ShieldCheck,
  ArrowRight,
  Command,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface SearchResult {
  id: string
  type: 'aircraft' | 'task' | 'part' | 'team' | 'compliance'
  title: string
  subtitle: string
  href: string
}

// Mock search data - in real app, this would come from API
const mockSearchData: SearchResult[] = [
  // Aircraft
  { id: 'a1', type: 'aircraft', title: 'N12345', subtitle: 'Boeing 737-800 · Operational', href: '/fleet' },
  { id: 'a2', type: 'aircraft', title: 'N67890', subtitle: 'Airbus A320 · In Maintenance', href: '/fleet' },
  { id: 'a3', type: 'aircraft', title: 'N24680', subtitle: 'Embraer E175 · Grounded', href: '/fleet' },
  { id: 'a4', type: 'aircraft', title: 'N11111', subtitle: 'Boeing 777-300 · Operational', href: '/fleet' },
  // Tasks
  { id: 't1', type: 'task', title: 'C-Check Inspection', subtitle: 'N12345 · In Progress', href: '/maintenance' },
  { id: 't2', type: 'task', title: 'Engine Borescope', subtitle: 'N67890 · Scheduled', href: '/maintenance' },
  { id: 't3', type: 'task', title: 'Landing Gear Overhaul', subtitle: 'N24680 · Critical', href: '/maintenance' },
  { id: 't4', type: 'task', title: 'A-Check Service', subtitle: 'N11111 · Completed', href: '/maintenance' },
  // Parts
  { id: 'p1', type: 'part', title: 'Oil Filter CH48110', subtitle: '45 in stock · Low stock', href: '/parts' },
  { id: 'p2', type: 'part', title: 'Brake Assembly', subtitle: '12 in stock', href: '/parts' },
  { id: 'p3', type: 'part', title: 'Fuel Pump', subtitle: '8 in stock', href: '/parts' },
  // Team
  { id: 'u1', type: 'team', title: 'Mike Johnson', subtitle: 'Mechanic · A&P Licensed', href: '/team' },
  { id: 'u2', type: 'team', title: 'Sarah Chen', subtitle: 'Inspector · IA Certificate', href: '/team' },
  { id: 'u3', type: 'team', title: 'John Smith', subtitle: 'Maintenance Controller', href: '/team' },
  // Compliance
  { id: 'c1', type: 'compliance', title: 'AD 2024-15-08', subtitle: 'Wing Spar Inspection · Pending', href: '/compliance' },
  { id: 'c2', type: 'compliance', title: 'Annual Inspection', subtitle: 'N67890 · Overdue', href: '/compliance' },
]

const typeIcons: Record<string, typeof Plane> = {
  aircraft: Plane,
  task: Wrench,
  part: Package,
  team: Users,
  compliance: ShieldCheck,
}

const typeLabels: Record<string, string> = {
  aircraft: 'Aircraft',
  task: 'Task',
  part: 'Part',
  team: 'Team',
  compliance: 'Compliance',
}

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Filter results based on query
  useEffect(() => {
    if (query.trim() === '') {
      setResults([])
      return
    }

    const filtered = mockSearchData.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase())
    )
    setResults(filtered.slice(0, 8))
    setSelectedIndex(0)
  }, [query])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault()
        navigate(results[selectedIndex].href)
        onOpenChange(false)
        setQuery('')
      }
    },
    [results, selectedIndex, navigate, onOpenChange]
  )

  const handleResultClick = (result: SearchResult) => {
    navigate(result.href)
    onOpenChange(false)
    setQuery('')
  }

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="sr-only">Search</DialogTitle>
        </DialogHeader>
        <div className="flex items-center border-b px-4">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <Input
            placeholder="Search aircraft, tasks, parts, team..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 text-lg h-14"
            autoFocus
          />
        </div>

        {results.length > 0 ? (
          <div className="max-h-[400px] overflow-y-auto p-2">
            {results.map((result, index) => {
              const Icon = typeIcons[result.type]
              return (
                <div
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer
                    ${index === selectedIndex ? 'bg-accent' : 'hover:bg-muted'}
                  `}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{result.title}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {result.subtitle}
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {typeLabels[result.type]}
                  </Badge>
                  {index === selectedIndex && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        ) : query.trim() !== '' ? (
          <div className="p-8 text-center text-muted-foreground">
            No results found for "{query}"
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <p className="mb-4">Start typing to search across:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {Object.entries(typeLabels).map(([key, label]) => {
                const Icon = typeIcons[key]
                return (
                  <Badge key={key} variant="outline" className="gap-1">
                    <Icon className="h-3 w-3" />
                    {label}
                  </Badge>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd>
              to select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Esc</kbd>
            to close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onClick()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClick])

  return (
    <Button
      variant="outline"
      className="relative w-64 justify-start text-muted-foreground"
      onClick={onClick}
    >
      <Search className="mr-2 h-4 w-4" />
      <span>Search...</span>
      <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
        <Command className="h-3 w-3" />K
      </kbd>
    </Button>
  )
}
