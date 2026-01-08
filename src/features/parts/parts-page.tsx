import { useState } from 'react'
import { Plus, Search, Filter, AlertTriangle, Package, BoxIcon, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PermissionGate } from '@/components/permission-gate'
import { useAppSelector } from '@/app/store'
import {
  useGetPartDefinitionsQuery,
  useGetPartItemsQuery,
  type ApiPartDefinition,
  type ApiPartItemStatus,
} from '@/lib/api'

// Display part type for UI
interface DisplayPart {
  id: string
  serialNumber: string
  name: string
  category: string
  status: ApiPartItemStatus
  expiryDate: string | null
  createdAt: string
}

// Status display configuration
const statusColors: Record<ApiPartItemStatus, string> = {
  in_stock: 'bg-operational-light text-operational-dark',
  used: 'bg-scheduled-light text-scheduled-dark',
  disposed: 'bg-grounded-light text-grounded-dark',
}

const statusLabels: Record<ApiPartItemStatus, string> = {
  in_stock: 'In Stock',
  used: 'Used',
  disposed: 'Disposed',
}

export function PartsPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { orgId, isAuthenticated } = useAppSelector((state) => state.auth)
  const isDemo = !isAuthenticated || !orgId

  // RTK Query
  const { data: apiDefinitions, isLoading: isLoadingDefs, refetch: refetchDefs, isFetching: isFetchingDefs } = useGetPartDefinitionsQuery(
    {},
    { skip: isDemo }
  )
  const { data: apiItems, isLoading: isLoadingItems, refetch: refetchItems, isFetching: isFetchingItems } = useGetPartItemsQuery(
    { status: statusFilter === 'all' ? undefined : statusFilter },
    { skip: isDemo }
  )

  const isLoading = isLoadingDefs || isLoadingItems
  const isFetching = isFetchingDefs || isFetchingItems

  const refetch = () => {
    refetchDefs()
    refetchItems()
  }

  // Create a lookup map for part definitions
  const definitionMap = new Map<string, ApiPartDefinition>(
    (apiDefinitions || []).map((def) => [def.id, def])
  )

  // Convert API data to display format
  const displayParts: DisplayPart[] = (apiItems || []).map((item) => {
    const definition = definitionMap.get(item.part_definition_id)
    return {
      id: item.id,
      serialNumber: item.serial_number,
      name: definition?.name || 'Unknown Part',
      category: definition?.category || 'Unknown',
      status: item.status,
      expiryDate: item.expiry_date,
      createdAt: item.created_at,
    }
  })

  // Get unique categories
  const categories = [...new Set((apiDefinitions || []).map((d) => d.category))]

  // Filter parts
  const filteredParts = displayParts.filter((part) => {
    const matchesCategory = categoryFilter === 'all' || part.category === categoryFilter
    const matchesSearch =
      part.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Calculate stats
  const inStockCount = displayParts.filter((p) => p.status === 'in_stock').length
  const usedCount = displayParts.filter((p) => p.status === 'used').length
  const disposedCount = displayParts.filter((p) => p.status === 'disposed').length

  // Find parts expiring soon (within 90 days)
  const expiringParts = displayParts.filter((p) => {
    if (!p.expiryDate) return false
    const expiryDate = new Date(p.expiryDate)
    const now = new Date()
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry > 0 && daysUntilExpiry <= 90
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parts Inventory</h1>
          <p className="text-muted-foreground">
            Manage parts inventory and stock levels
            {isDemo && <span className="ml-2 text-xs text-amber-600">(Demo Mode)</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={refetch} disabled={isDemo || isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <PermissionGate permission="manage:parts">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Part
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Part Definitions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiDefinitions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Unique part types</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-operational">
              <BoxIcon className="h-4 w-4" />
              In Stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-operational">{inStockCount}</div>
            <p className="text-xs text-muted-foreground">Available items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-scheduled">
              Used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-scheduled">{usedCount}</div>
            <p className="text-xs text-muted-foreground">Items in use</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-grounded">
              Disposed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-grounded">{disposedCount}</div>
            <p className="text-xs text-muted-foreground">Retired items</p>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Parts Alert */}
      {expiringParts.length > 0 && (
        <Card className="border-maintenance/50 bg-maintenance-light/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-maintenance" />
              <div>
                <p className="font-medium text-maintenance-dark">Expiring Soon</p>
                <p className="text-sm text-muted-foreground">
                  {expiringParts.length} part(s) expiring within 90 days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by serial number or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="disposed">Disposed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Parts Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead>Serial Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : filteredParts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {isDemo ? 'No parts data in demo mode' : 'No parts found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredParts.map((part) => (
                  <TableRow
                    key={part.id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-mono font-semibold">
                      {part.serialNumber}
                    </TableCell>
                    <TableCell>{part.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{part.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusColors[part.status]
                        }`}
                      >
                        {statusLabels[part.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {part.expiryDate
                        ? new Date(part.expiryDate).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(part.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
