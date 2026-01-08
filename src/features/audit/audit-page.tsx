import { useState, useMemo } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  History,
  Search,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  User,
  Plane,
  Wrench,
  Package,
  ShieldCheck,
  FileText,
  Settings,
  Bell,
  Users,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Pagination } from '@/components/ui/pagination'
import { AdvancedFilters, type FilterValue, type FilterField } from '@/components/advanced-filters'
import { useGetAuditLogsQuery, useGetUsersQuery } from '@/lib/api'
import { transformAuditLogs } from '@/lib/audit-transform'
import { exportToCSV, formatDateForExport } from '@/lib/export-utils'
import type { AuditAction, AuditResource, AuditLogEntry } from '@/types/audit'

const actionColors: Record<AuditAction, string> = {
  create: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  update: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  login: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  logout: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  status_change: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  state_change: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  assign: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  unassign: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  approve: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  reject: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  export: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  import: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
}

const resourceIcons: Record<AuditResource, React.ReactNode> = {
  aircraft: <Plane className="h-4 w-4" />,
  task: <Wrench className="h-4 w-4" />,
  part: <Package className="h-4 w-4" />,
  user: <User className="h-4 w-4" />,
  team: <Users className="h-4 w-4" />,
  compliance: <ShieldCheck className="h-4 w-4" />,
  report: <FileText className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
  notification: <Bell className="h-4 w-4" />,
}

const filterFields: FilterField[] = [
  {
    id: 'action',
    label: 'Action',
    type: 'select',
    options: [
      { value: 'create', label: 'Create' },
      { value: 'update', label: 'Update' },
      { value: 'delete', label: 'Delete' },
      { value: 'status_change', label: 'Status Change' },
      { value: 'assign', label: 'Assign' },
      { value: 'approve', label: 'Approve' },
      { value: 'login', label: 'Login' },
      { value: 'export', label: 'Export' },
    ],
  },
  {
    id: 'resource',
    label: 'Resource',
    type: 'select',
    options: [
      { value: 'aircraft', label: 'Aircraft' },
      { value: 'task', label: 'Task' },
      { value: 'part', label: 'Part' },
      { value: 'user', label: 'User' },
      { value: 'compliance', label: 'Compliance' },
      { value: 'report', label: 'Report' },
    ],
  },
  { id: 'userName', label: 'User', type: 'text' },
  { id: 'resourceName', label: 'Resource Name', type: 'text' },
]

const filterPresets = [
  {
    name: 'Recent Changes',
    filters: [{ field: 'action', operator: 'in' as const, value: ['create', 'update', 'delete'] }],
  },
  {
    name: 'Security Events',
    filters: [{ field: 'action', operator: 'in' as const, value: ['login', 'logout'] }],
  },
  {
    name: 'Aircraft Activity',
    filters: [{ field: 'resource', operator: 'equals' as const, value: 'aircraft' }],
  },
]

function AuditEntryRow({ entry }: { entry: AuditLogEntry }) {
  const [isOpen, setIsOpen] = useState(false)
  const hasChanges = entry.changes && entry.changes.length > 0

  return (
    <>
      <TableRow className="hover:bg-muted/50">
        <TableCell className="w-10">
          {hasChanges ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          ) : (
            <div className="w-6" />
          )}
        </TableCell>
        <TableCell className="w-[120px]">
          <div className="flex flex-col">
            <span className="text-sm">
              {format(new Date(entry.timestamp), 'MMM d, yyyy')}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(entry.timestamp), 'h:mm a')}
            </span>
          </div>
        </TableCell>
        <TableCell className="w-[200px]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium shrink-0">
              {entry.userName.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{entry.userName}</div>
              <div className="text-xs text-muted-foreground truncate">{entry.userEmail}</div>
            </div>
          </div>
        </TableCell>
        <TableCell className="w-[120px]">
          <Badge className={actionColors[entry.action]}>
            {entry.action.replace('_', ' ')}
          </Badge>
        </TableCell>
        <TableCell className="w-[120px]">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center shrink-0">
              {resourceIcons[entry.resource]}
            </div>
            <span className="capitalize">{entry.resource}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{entry.resourceName}</div>
            <div className="text-xs text-muted-foreground font-mono truncate">{entry.resourceId}</div>
          </div>
        </TableCell>
        <TableCell className="text-right text-sm text-muted-foreground w-[140px] whitespace-nowrap">
          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
        </TableCell>
      </TableRow>
      {hasChanges && isOpen && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={7} className="py-3">
            <div className="ml-6 space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Changes Made
              </div>
              <div className="grid gap-2">
                {entry.changes?.map((change, index) => (
                  <div key={index} className="flex items-center gap-4 text-sm">
                    <span className="font-medium min-w-[120px]">{change.field}:</span>
                    <div className="flex items-center gap-2">
                      <span className="line-through text-muted-foreground">
                        {JSON.stringify(change.oldValue)}
                      </span>
                      <span>→</span>
                      <span className="font-medium text-primary">
                        {JSON.stringify(change.newValue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {entry.metadata && (
                <div className="mt-3 pt-2 border-t">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Additional Info
                  </div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(entry.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export function AuditPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterValue[]>([])
  const [timeRange, setTimeRange] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Calculate offset for API
  const offset = (page - 1) * pageSize

  // Fetch audit logs and users from API
  const {
    data: auditLogs,
    isLoading: isLoadingLogs,
    isFetching,
    error: logsError,
    refetch: refetchLogs
  } = useGetAuditLogsQuery({ limit: pageSize, offset })

  const {
    data: users,
    isLoading: isLoadingUsers
  } = useGetUsersQuery({})

  // Transform API data to frontend format
  const entries = useMemo(() => {
    if (!auditLogs) return []
    return transformAuditLogs(auditLogs, users || [])
  }, [auditLogs, users])

  const isLoading = isLoadingLogs || isLoadingUsers

  const filteredEntries = useMemo(() => {
    let result = [...entries]

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.userName.toLowerCase().includes(query) ||
          e.resourceName.toLowerCase().includes(query) ||
          e.resourceId.toLowerCase().includes(query) ||
          e.action.toLowerCase().includes(query)
      )
    }

    // Apply time range
    if (timeRange !== 'all') {
      const now = Date.now()
      const ranges: Record<string, number> = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      }
      const cutoff = now - (ranges[timeRange] || 0)
      result = result.filter((e) => new Date(e.timestamp).getTime() > cutoff)
    }

    // Apply advanced filters
    filters.forEach((filter) => {
      if (!filter.value || (Array.isArray(filter.value) && filter.value.length === 0)) return

      result = result.filter((e) => {
        const fieldValue = e[filter.field as keyof AuditLogEntry]
        const filterValue = filter.value

        switch (filter.operator) {
          case 'equals':
            return fieldValue === filterValue
          case 'contains':
            return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase())
          case 'in':
            return Array.isArray(filterValue) && filterValue.includes(String(fieldValue))
          default:
            return true
        }
      })
    })

    return result
  }, [entries, searchQuery, timeRange, filters])

  const stats = useMemo(() => {
    const last24h = entries.filter(
      (e) => new Date(e.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
    )
    return {
      total: entries.length,
      last24h: last24h.length,
      creates: last24h.filter((e) => e.action === 'create').length,
      updates: last24h.filter((e) => e.action === 'update').length,
      deletes: last24h.filter((e) => e.action === 'delete').length,
    }
  }, [entries])

  const handleExport = () => {
    if (filteredEntries.length === 0) return

    exportToCSV(filteredEntries, 'audit-log', [
      { key: 'timestamp', header: 'Timestamp', format: (v) => formatDateForExport(v as string) },
      { key: 'userName', header: 'User' },
      { key: 'userEmail', header: 'Email' },
      { key: 'action', header: 'Action' },
      { key: 'resource', header: 'Resource' },
      { key: 'resourceName', header: 'Resource Name' },
      { key: 'resourceId', header: 'Resource ID' },
    ])
  }

  // Handle page size change - reset to page 1
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-8 w-8" />
            Audit Log
          </h1>
          <p className="text-muted-foreground">
            Track all system changes and user activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={isLoading || entries.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="icon" onClick={() => refetchLogs()} disabled={isLoading || isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error State */}
      {logsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading audit logs</AlertTitle>
          <AlertDescription>
            {'status' in logsError
              ? `Failed to fetch audit logs (${logsError.status})`
              : 'An unexpected error occurred. Please try again.'}
            <Button variant="link" className="h-auto p-0 ml-2" onClick={() => refetchLogs()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Entries</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last 24 Hours</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{stats.last24h}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Creates (24h)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-10" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats.creates}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Updates (24h)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-10" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">{stats.updates}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Deletes (24h)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-10" />
            ) : (
              <div className="text-2xl font-bold text-red-600">{stats.deletes}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="1h">Last hour</SelectItem>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>

        <AdvancedFilters
          fields={filterFields}
          filters={filters}
          onFiltersChange={setFilters}
          storageKey="audit_log"
          presets={filterPresets}
        />
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Activity History</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `Showing ${filteredEntries.length} entries (Page ${page})`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[200px]">User</TableHead>
                  <TableHead className="w-[120px]">Action</TableHead>
                  <TableHead className="w-[120px]">Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right w-[120px]">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton rows
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="w-6" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-20" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-6" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No audit entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <AuditEntryRow key={entry.id} entry={entry} />
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Pagination */}
          <Pagination
            page={page}
            pageSize={pageSize}
            total={entries.length > 0 ? entries.length + (entries.length === pageSize ? pageSize : 0) : 0}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>
    </div>
  )
}
