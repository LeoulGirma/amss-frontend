import { useState } from 'react'
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Calendar,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import type { ComplianceItem, ComplianceStatus, ComplianceCategory } from '@/types'

const statusConfig: Record<ComplianceStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  compliant: {
    label: 'Compliant',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: CheckCircle,
  },
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    icon: Clock,
  },
  overdue: {
    label: 'Overdue',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: AlertTriangle,
  },
  not_applicable: {
    label: 'N/A',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    icon: FileText,
  },
}

const categoryLabels: Record<ComplianceCategory, string> = {
  ad: 'Airworthiness Directive',
  sb: 'Service Bulletin',
  inspection: 'Required Inspection',
  certification: 'Certification',
  training: 'Training',
}

// Mock data
const mockComplianceItems: ComplianceItem[] = [
  {
    id: '1',
    title: 'AD 2024-15-08 - Wing Spar Inspection',
    description: 'Mandatory inspection of wing spar attach fittings for fatigue cracking',
    category: 'ad',
    status: 'pending',
    aircraftId: '1',
    tailNumber: 'N12345',
    dueDate: '2025-01-15',
    regulatoryReference: 'FAA AD 2024-15-08',
    priority: 'high',
    assignedTo: 'Sarah Chen',
    notes: 'Parts ordered, waiting for delivery',
    createdAt: '2024-11-01',
    updatedAt: '2024-12-20',
  },
  {
    id: '2',
    title: 'SB 737-57-1234 - Fuel Tank Sealant',
    description: 'Service bulletin for fuel tank sealant replacement in center wing tank',
    category: 'sb',
    status: 'compliant',
    aircraftId: '1',
    tailNumber: 'N12345',
    dueDate: '2024-12-01',
    completedDate: '2024-11-28',
    regulatoryReference: 'Boeing SB 737-57-1234',
    priority: 'medium',
    assignedTo: 'Mike Johnson',
    notes: 'Completed during last C-Check',
    createdAt: '2024-08-15',
    updatedAt: '2024-11-28',
  },
  {
    id: '3',
    title: 'Annual Inspection - N67890',
    description: 'FAR 91.409 required annual inspection',
    category: 'inspection',
    status: 'overdue',
    aircraftId: '2',
    tailNumber: 'N67890',
    dueDate: '2024-12-15',
    regulatoryReference: 'FAR 91.409',
    priority: 'critical',
    assignedTo: 'Sarah Chen',
    notes: 'Scheduling in progress',
    createdAt: '2024-06-01',
    updatedAt: '2024-12-20',
  },
  {
    id: '4',
    title: 'AD 2024-22-05 - Landing Gear Actuator',
    description: 'Inspection and replacement of landing gear actuator seals',
    category: 'ad',
    status: 'compliant',
    aircraftId: '3',
    tailNumber: 'N24680',
    dueDate: '2024-11-30',
    completedDate: '2024-11-15',
    regulatoryReference: 'FAA AD 2024-22-05',
    priority: 'high',
    assignedTo: 'Tom Wilson',
    notes: '',
    createdAt: '2024-09-01',
    updatedAt: '2024-11-15',
  },
  {
    id: '5',
    title: 'A&P License Renewal - Mike Johnson',
    description: 'Mechanic A&P license renewal required',
    category: 'certification',
    status: 'pending',
    dueDate: '2025-03-15',
    regulatoryReference: 'FAR 65.83',
    priority: 'medium',
    assignedTo: 'Mike Johnson',
    notes: 'Renewal application submitted',
    createdAt: '2024-12-01',
    updatedAt: '2024-12-01',
  },
  {
    id: '6',
    title: 'Recurrent Training - Hazmat',
    description: 'Annual hazardous materials handling recurrent training',
    category: 'training',
    status: 'pending',
    dueDate: '2025-02-01',
    regulatoryReference: '49 CFR 172.704',
    priority: 'low',
    assignedTo: 'All Mechanics',
    notes: 'Training scheduled for January 15',
    createdAt: '2024-11-15',
    updatedAt: '2024-12-10',
  },
]

function ComplianceStatusBadge({ status }: { status: ComplianceStatus }) {
  const config = statusConfig[status]
  const Icon = config.icon
  return (
    <Badge className={`${config.color} gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  }
  return (
    <Badge className={colors[priority] || colors.medium}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  )
}

export function CompliancePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<ComplianceItem | null>(null)

  // Use mock data for demo mode
  const isLoading = false
  const usingMockData = true
  const complianceItems = mockComplianceItems

  const refetch = () => {}

  const filteredItems = complianceItems.filter((item: ComplianceItem) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tailNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    return matchesStatus && matchesCategory && matchesSearch
  })

  const stats = {
    total: complianceItems.length,
    compliant: complianceItems.filter((i: ComplianceItem) => i.status === 'compliant').length,
    pending: complianceItems.filter((i: ComplianceItem) => i.status === 'pending').length,
    overdue: complianceItems.filter((i: ComplianceItem) => i.status === 'overdue').length,
  }

  const complianceRate = stats.total > 0
    ? Math.round((stats.compliant / stats.total) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance</h1>
          <p className="text-muted-foreground">
            Track regulatory compliance and sign-offs
            {usingMockData && (
              <span className="ml-2 text-xs text-maintenance">(Demo Data)</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Compliance Rate</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-operational">{complianceRate}%</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Compliant</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-operational" />
                <span className="text-2xl font-bold">{stats.compliant}</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-maintenance" />
                <span className="text-2xl font-bold">{stats.pending}</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-grounded" />
                <span className="text-2xl font-bold text-grounded">{stats.overdue}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {stats.overdue > 0 && (
        <Card className="border-grounded/50 bg-grounded/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-grounded" />
              <div>
                <p className="font-medium text-grounded">
                  {stats.overdue} overdue compliance item{stats.overdue > 1 ? 's' : ''} require immediate attention
                </p>
                <p className="text-sm text-muted-foreground">
                  Review and address overdue items to maintain regulatory compliance
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
            placeholder="Search compliance items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="compliant">Compliant</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="ad">Airworthiness Directives</SelectItem>
            <SelectItem value="sb">Service Bulletins</SelectItem>
            <SelectItem value="inspection">Inspections</SelectItem>
            <SelectItem value="certification">Certifications</SelectItem>
            <SelectItem value="training">Training</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Compliance Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Aircraft</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Assigned To</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredItems.map((item: ComplianceItem) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedItem(item)}
                  >
                    <TableCell>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-[250px]">
                        {item.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{categoryLabels[item.category]}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.tailNumber ? (
                        <span className="font-mono font-semibold">{item.tailNumber}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ComplianceStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={item.priority} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(item.dueDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{item.assignedTo || '—'}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Compliance Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl">{selectedItem.title}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {categoryLabels[selectedItem.category]}
                      {selectedItem.tailNumber && ` · ${selectedItem.tailNumber}`}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    <ComplianceStatusBadge status={selectedItem.status} />
                    <PriorityBadge priority={selectedItem.priority} />
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Regulatory Reference:</span>
                      <div className="font-medium flex items-center gap-1 mt-1">
                        {selectedItem.regulatoryReference}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Due Date:</span>
                      <div className="font-medium mt-1">
                        {new Date(selectedItem.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    {selectedItem.completedDate && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Completed:</span>
                        <div className="font-medium text-operational mt-1">
                          {new Date(selectedItem.completedDate).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Assigned To:</span>
                      <div className="font-medium mt-1">{selectedItem.assignedTo || 'Unassigned'}</div>
                    </div>
                    {selectedItem.tailNumber && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Aircraft:</span>
                        <div className="font-mono font-medium mt-1">{selectedItem.tailNumber}</div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedItem.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground">{selectedItem.notes}</p>
                    </div>
                  </>
                )}

                <Separator />

                <div className="text-xs text-muted-foreground">
                  <p>Created: {new Date(selectedItem.createdAt).toLocaleDateString()}</p>
                  <p>Last Updated: {new Date(selectedItem.updatedAt).toLocaleDateString()}</p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setSelectedItem(null)}>
                    Close
                  </Button>
                  {selectedItem.status !== 'compliant' && (
                    <Button>Mark as Compliant</Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
