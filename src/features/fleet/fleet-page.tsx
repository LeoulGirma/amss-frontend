import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Filter, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AircraftStatusBadge } from '@/components/aircraft-status-badge'
import { AircraftForm } from './aircraft-form'
import { PermissionGate } from '@/components/permission-gate'
import { usePermissions } from '@/hooks'
import { useAppSelector } from '@/app/store'
import {
  useGetAircraftListQuery,
  useCreateAircraftMutation,
  useUpdateAircraftMutation,
  useDeleteAircraftMutation,
  type ApiAircraft,
  type AircraftCreateRequest,
  type AircraftUpdateRequest,
} from '@/lib/api'
import type { AircraftStatus } from '@/types'

// Mock data for demo mode
const mockAircraft: ApiAircraft[] = [
  {
    id: '1',
    org_id: 'demo-org',
    tail_number: 'N12345',
    model: 'Boeing 737-800',
    status: 'operational',
    capacity_slots: 4,
    flight_hours_total: 24500,
    cycles_total: 15000,
    last_maintenance: '2024-11-15T00:00:00Z',
    next_due: '2025-02-15T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-12-01T00:00:00Z',
  },
  {
    id: '2',
    org_id: 'demo-org',
    tail_number: 'N67890',
    model: 'Airbus A320',
    status: 'maintenance',
    capacity_slots: 4,
    flight_hours_total: 18200,
    cycles_total: 12000,
    last_maintenance: '2024-10-01T00:00:00Z',
    next_due: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-12-15T00:00:00Z',
  },
  {
    id: '3',
    org_id: 'demo-org',
    tail_number: 'N24680',
    model: 'Embraer E175',
    status: 'grounded',
    capacity_slots: 2,
    flight_hours_total: 12800,
    cycles_total: 9500,
    last_maintenance: '2024-09-01T00:00:00Z',
    next_due: '2024-12-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-12-10T00:00:00Z',
  },
  {
    id: '4',
    org_id: 'demo-org',
    tail_number: 'N11111',
    model: 'Boeing 777-300',
    status: 'operational',
    capacity_slots: 6,
    flight_hours_total: 42100,
    cycles_total: 8500,
    last_maintenance: '2024-08-01T00:00:00Z',
    next_due: '2025-08-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-11-01T00:00:00Z',
  },
  {
    id: '5',
    org_id: 'demo-org',
    tail_number: 'N22222',
    model: 'Airbus A321',
    status: 'operational',
    capacity_slots: 4,
    flight_hours_total: 15600,
    cycles_total: 11000,
    last_maintenance: '2024-12-01T00:00:00Z',
    next_due: '2025-01-15T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-12-20T00:00:00Z',
  },
  {
    id: '6',
    org_id: 'demo-org',
    tail_number: 'N33333',
    model: 'Boeing 737 MAX 8',
    status: 'maintenance',
    capacity_slots: 4,
    flight_hours_total: 8900,
    cycles_total: 5200,
    last_maintenance: '2024-11-01T00:00:00Z',
    next_due: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-12-18T00:00:00Z',
  },
]

// Helper to format next maintenance info
function formatNextMaintenance(aircraft: ApiAircraft): string {
  if (aircraft.status === 'maintenance') {
    return 'In Maintenance'
  }
  if (aircraft.next_due) {
    const nextDue = new Date(aircraft.next_due)
    const now = new Date()
    const daysUntil = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntil < 0) return 'Overdue'
    if (daysUntil < 30) return `Due in ${daysUntil} days`
    return nextDue.toLocaleDateString()
  }
  return 'Not scheduled'
}

export function FleetPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedAircraft, setSelectedAircraft] = useState<ApiAircraft | null>(null)

  const { orgId, isAuthenticated } = useAppSelector((state) => state.auth)
  const { can } = usePermissions()
  const canManageFleet = can('manage:fleet')
  const isDemo = !isAuthenticated || !orgId

  // RTK Query hooks
  const { data: apiData, isLoading, error, refetch, isFetching } = useGetAircraftListQuery(
    { status: statusFilter === 'all' ? undefined : statusFilter },
    { skip: isDemo }
  )
  const [createAircraft, { isLoading: isCreating }] = useCreateAircraftMutation()
  const [updateAircraft, { isLoading: isUpdating }] = useUpdateAircraftMutation()
  const [deleteAircraft, { isLoading: isDeleting }] = useDeleteAircraftMutation()

  // Use API data or fallback to mock data for unauthenticated users
  const aircraft = isDemo ? mockAircraft : (apiData || [])
  const usingMockData = isDemo
  const hasError = !isDemo && !!error

  const filteredAircraft = aircraft.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    const matchesSearch =
      a.tail_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.model.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleAddClick = () => {
    setSelectedAircraft(null)
    setFormOpen(true)
  }

  const handleRowClick = (aircraft: ApiAircraft) => {
    if (!canManageFleet) return
    setSelectedAircraft(aircraft)
    setFormOpen(true)
  }

  const handleSubmit = async (data: AircraftCreateRequest | AircraftUpdateRequest) => {
    try {
      if (selectedAircraft) {
        if (!isDemo) {
          await updateAircraft({ id: selectedAircraft.id, data: data as AircraftUpdateRequest }).unwrap()
        }
        toast.success(isDemo ? 'Aircraft updated (demo)' : 'Aircraft updated successfully')
      } else {
        if (!isDemo) {
          await createAircraft(data as AircraftCreateRequest).unwrap()
        }
        toast.success(isDemo ? 'Aircraft added (demo)' : 'Aircraft added successfully')
      }
      setFormOpen(false)
    } catch (error) {
      console.error('Error saving aircraft:', error)
      toast.error('Failed to save aircraft. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      if (!isDemo) {
        await deleteAircraft({ id }).unwrap()
      }
      toast.success(isDemo ? 'Aircraft deleted (demo)' : 'Aircraft deleted successfully')
      setFormOpen(false)
    } catch (error) {
      console.error('Error deleting aircraft:', error)
      toast.error('Failed to delete aircraft. Please try again.')
    }
  }

  const stats = {
    total: aircraft.length,
    operational: aircraft.filter((a) => a.status === 'operational').length,
    maintenance: aircraft.filter((a) => a.status === 'maintenance').length,
    grounded: aircraft.filter((a) => a.status === 'grounded').length,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fleet</h1>
          <p className="text-muted-foreground">
            Manage your aircraft fleet
            {usingMockData && (
              <span className="ml-2 text-xs text-amber-600">(Demo Data)</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isDemo || isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <PermissionGate permission="manage:fleet">
            <Button onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" />
              Add Aircraft
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Error State */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading fleet data</AlertTitle>
          <AlertDescription>
            {'status' in error
              ? `Failed to fetch aircraft (${error.status})`
              : 'An unexpected error occurred. Please try again.'}
            <Button variant="link" className="h-auto p-0 ml-2" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Aircraft</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !isDemo ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Operational</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !isDemo ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats.operational}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Maintenance</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !isDemo ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-amber-600">{stats.maintenance}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Grounded</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !isDemo ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-red-600">{stats.grounded}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by tail number or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="operational">Operational</SelectItem>
            <SelectItem value="maintenance">In Maintenance</SelectItem>
            <SelectItem value="grounded">Grounded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Aircraft Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead>Tail Number</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Flight Hours</TableHead>
                <TableHead className="text-right">Cycles</TableHead>
                <TableHead>Next Maintenance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isLoading || (isFetching && aircraft.length === 0)) && !isDemo ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  </TableRow>
                ))
              ) : filteredAircraft.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No aircraft found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAircraft.map((aircraft) => (
                  <TableRow
                    key={aircraft.id}
                    className={canManageFleet ? 'cursor-pointer hover:bg-muted/50' : ''}
                    onClick={() => handleRowClick(aircraft)}
                  >
                    <TableCell className="font-mono font-semibold">
                      {aircraft.tail_number}
                    </TableCell>
                    <TableCell>{aircraft.model}</TableCell>
                    <TableCell>
                      <AircraftStatusBadge status={aircraft.status as AircraftStatus} />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {(aircraft.flight_hours_total || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {(aircraft.cycles_total || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatNextMaintenance(aircraft)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Aircraft Form */}
      <AircraftForm
        open={formOpen}
        onOpenChange={setFormOpen}
        aircraft={selectedAircraft}
        onSubmit={handleSubmit}
        onDelete={selectedAircraft ? () => handleDelete(selectedAircraft.id) : undefined}
        isLoading={isCreating || isUpdating}
        isDeleting={isDeleting}
      />
    </div>
  )
}
