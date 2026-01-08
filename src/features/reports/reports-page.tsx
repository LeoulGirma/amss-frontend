import { useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  FileText,
  Download,
  Calendar,
  Plane,
  Wrench,
  Package,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Clock,
  Printer,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  PrintButton,
  FleetStatusReportContent,
  MaintenanceReportContent,
  ComplianceReportContent,
} from '@/components/print-report'
import { useAppSelector } from '@/app/store'
import {
  useGetReportSummaryQuery,
  useGetAircraftListQuery,
  useGetTasksQuery,
  useGetPartItemsQuery,
  useGetPartDefinitionsQuery,
  useGetComplianceItemsQuery,
  type ApiAircraft,
  type ApiTask,
  type ApiPartItem,
  type ApiPartDefinition,
} from '@/lib/api'
import { exportToCSV, printReport, formatDateForExport, formatDateShort } from '@/lib/export-utils'

interface ReportTemplate {
  id: string
  title: string
  description: string
  icon: typeof FileText
  category: 'fleet' | 'maintenance' | 'compliance' | 'inventory'
  formats: string[]
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'fleet-status',
    title: 'Fleet Status Report',
    description: 'Current status of all aircraft including operational status and maintenance needs',
    icon: Plane,
    category: 'fleet',
    formats: ['PDF', 'CSV'],
  },
  {
    id: 'maintenance-history',
    title: 'Maintenance Tasks',
    description: 'All maintenance tasks with status, type, and scheduling information',
    icon: Wrench,
    category: 'maintenance',
    formats: ['PDF', 'CSV'],
  },
  {
    id: 'upcoming-maintenance',
    title: 'Upcoming Maintenance',
    description: 'Scheduled maintenance tasks for the upcoming period',
    icon: Calendar,
    category: 'maintenance',
    formats: ['PDF', 'CSV'],
  },
  {
    id: 'compliance-status',
    title: 'Compliance Status Report',
    description: 'Current compliance status for all compliance items',
    icon: ShieldCheck,
    category: 'compliance',
    formats: ['PDF', 'CSV'],
  },
  {
    id: 'parts-inventory',
    title: 'Parts Inventory Report',
    description: 'Current inventory levels and part status',
    icon: Package,
    category: 'inventory',
    formats: ['PDF', 'CSV'],
  },
  {
    id: 'task-summary',
    title: 'Task Summary',
    description: 'Summary of tasks by status and type',
    icon: BarChart3,
    category: 'maintenance',
    formats: ['PDF'],
  },
  {
    id: 'fleet-utilization',
    title: 'Fleet Utilization',
    description: 'Fleet statistics including flight hours and cycles',
    icon: TrendingUp,
    category: 'fleet',
    formats: ['PDF', 'CSV'],
  },
  {
    id: 'overdue-tasks',
    title: 'Overdue Tasks Report',
    description: 'List of all overdue maintenance tasks requiring immediate attention',
    icon: Clock,
    category: 'maintenance',
    formats: ['PDF', 'CSV'],
  },
]

const categoryColors: Record<string, string> = {
  fleet: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  maintenance: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  compliance: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  inventory: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

export function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedFormat, setSelectedFormat] = useState<Record<string, string>>({})
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)

  const { orgId, isAuthenticated } = useAppSelector((state) => state.auth)
  const isDemo = !isAuthenticated || !orgId

  // API queries for report data
  const { data: reportSummary, isLoading: isLoadingSummary, refetch: refetchSummary } = useGetReportSummaryQuery(
    {},
    { skip: isDemo }
  )
  const { data: aircraft, isLoading: isLoadingAircraft, refetch: refetchAircraft } = useGetAircraftListQuery(
    {},
    { skip: isDemo }
  )
  const { data: tasks, isLoading: isLoadingTasks, refetch: refetchTasks } = useGetTasksQuery(
    {},
    { skip: isDemo }
  )
  const { data: partItems, refetch: refetchParts } = useGetPartItemsQuery(
    {},
    { skip: isDemo }
  )
  const { data: partDefinitions } = useGetPartDefinitionsQuery(
    {},
    { skip: isDemo }
  )
  const { data: complianceItems, refetch: refetchCompliance } = useGetComplianceItemsQuery(
    {},
    { skip: isDemo }
  )

  const isLoading = isLoadingSummary || isLoadingAircraft || isLoadingTasks

  const refetchAll = () => {
    refetchSummary()
    refetchAircraft()
    refetchTasks()
    refetchParts()
    refetchCompliance()
  }

  const filteredReports = selectedCategory === 'all'
    ? reportTemplates
    : reportTemplates.filter((r) => r.category === selectedCategory)

  // Generate fleet status report
  const generateFleetReport = (reportFormat: string) => {
    if (!aircraft || aircraft.length === 0) {
      toast.error('No aircraft data available')
      return
    }

    if (reportFormat === 'CSV') {
      exportToCSV(aircraft, 'fleet-status', [
        { key: 'tail_number', header: 'Tail Number' },
        { key: 'model', header: 'Model' },
        { key: 'status', header: 'Status' },
        { key: 'flight_hours_total', header: 'Flight Hours', format: (v) => String(v ?? 0) },
        { key: 'cycles_total', header: 'Cycles', format: (v) => String(v ?? 0) },
        { key: 'last_maintenance', header: 'Last Maintenance', format: (v) => formatDateShort(v as string) },
        { key: 'next_due', header: 'Next Due', format: (v) => formatDateShort(v as string) },
      ])
      toast.success('Fleet Status Report exported as CSV')
    } else {
      const content = generateFleetPDFContent(aircraft)
      printReport('Fleet Status Report', content, { orientation: 'landscape' })
    }
  }

  // Generate maintenance tasks report
  const generateMaintenanceReport = (reportFormat: string, filterScheduled = false) => {
    if (!tasks || tasks.length === 0) {
      toast.error('No maintenance task data available')
      return
    }

    const filteredTasks = filterScheduled
      ? tasks.filter((t) => t.state === 'scheduled')
      : tasks

    if (reportFormat === 'CSV') {
      const tasksWithAircraft = filteredTasks.map((task) => {
        const ac = aircraft?.find((a) => a.id === task.aircraft_id)
        return { ...task, tail_number: ac?.tail_number || 'Unknown' }
      })

      exportToCSV(tasksWithAircraft, filterScheduled ? 'upcoming-maintenance' : 'maintenance-tasks', [
        { key: 'tail_number', header: 'Aircraft' },
        { key: 'type', header: 'Type' },
        { key: 'state', header: 'Status' },
        { key: 'start_time', header: 'Start Date', format: (v) => formatDateShort(v as string) },
        { key: 'end_time', header: 'End Date', format: (v) => formatDateShort(v as string) },
        { key: 'notes', header: 'Notes' },
        { key: 'created_at', header: 'Created', format: (v) => formatDateForExport(v as string) },
      ])
      toast.success(`${filterScheduled ? 'Upcoming Maintenance' : 'Maintenance Tasks'} Report exported as CSV`)
    } else {
      const content = generateTasksPDFContent(filteredTasks, aircraft || [], filterScheduled)
      printReport(filterScheduled ? 'Upcoming Maintenance Report' : 'Maintenance Tasks Report', content)
    }
  }

  // Generate overdue tasks report
  const generateOverdueReport = (reportFormat: string) => {
    if (!tasks || tasks.length === 0) {
      toast.error('No maintenance task data available')
      return
    }

    const now = new Date()
    const overdueTasks = tasks.filter((t) => {
      if (t.state === 'completed' || t.state === 'cancelled') return false
      const endDate = new Date(t.end_time)
      return endDate < now
    })

    if (overdueTasks.length === 0) {
      toast.info('No overdue tasks found')
      return
    }

    if (reportFormat === 'CSV') {
      const tasksWithAircraft = overdueTasks.map((task) => {
        const ac = aircraft?.find((a) => a.id === task.aircraft_id)
        return { ...task, tail_number: ac?.tail_number || 'Unknown' }
      })

      exportToCSV(tasksWithAircraft, 'overdue-tasks', [
        { key: 'tail_number', header: 'Aircraft' },
        { key: 'type', header: 'Type' },
        { key: 'state', header: 'Status' },
        { key: 'start_time', header: 'Start Date', format: (v) => formatDateShort(v as string) },
        { key: 'end_time', header: 'Due Date', format: (v) => formatDateShort(v as string) },
        { key: 'notes', header: 'Notes' },
      ])
      toast.success('Overdue Tasks Report exported as CSV')
    } else {
      const content = generateOverduePDFContent(overdueTasks, aircraft || [])
      printReport('Overdue Tasks Report', content)
    }
  }

  // Generate parts inventory report
  const generatePartsReport = (reportFormat: string) => {
    if (!partItems || partItems.length === 0) {
      toast.error('No parts data available')
      return
    }

    const defMap = new Map(partDefinitions?.map((d) => [d.id, d]))

    if (reportFormat === 'CSV') {
      const partsWithNames = partItems.map((item) => {
        const def = defMap.get(item.part_definition_id)
        return {
          ...item,
          name: def?.name || 'Unknown',
          category: def?.category || 'Unknown',
        }
      })

      exportToCSV(partsWithNames, 'parts-inventory', [
        { key: 'serial_number', header: 'Serial Number' },
        { key: 'name', header: 'Part Name' },
        { key: 'category', header: 'Category' },
        { key: 'status', header: 'Status' },
        { key: 'expiry_date', header: 'Expiry Date', format: (v) => formatDateShort(v as string) },
        { key: 'created_at', header: 'Added', format: (v) => formatDateShort(v as string) },
      ])
      toast.success('Parts Inventory Report exported as CSV')
    } else {
      const content = generatePartsPDFContent(partItems, defMap)
      printReport('Parts Inventory Report', content)
    }
  }

  // Generate compliance report
  const generateComplianceReport = (reportFormat: string) => {
    if (!complianceItems || complianceItems.length === 0) {
      toast.error('No compliance data available')
      return
    }

    if (reportFormat === 'CSV') {
      exportToCSV(complianceItems, 'compliance-status', [
        { key: 'description', header: 'Description' },
        { key: 'result', header: 'Result' },
        { key: 'signed_off', header: 'Signed Off', format: (v) => v ? 'Yes' : 'No' },
        { key: 'task_id', header: 'Task ID' },
      ])
      toast.success('Compliance Report exported as CSV')
    } else {
      const content = generateCompliancePDFContent(complianceItems)
      printReport('Compliance Status Report', content)
    }
  }

  // Generate task summary report (PDF only)
  const generateTaskSummaryReport = () => {
    if (!tasks || tasks.length === 0) {
      toast.error('No maintenance task data available')
      return
    }

    const content = generateTaskSummaryPDFContent(tasks, reportSummary)
    printReport('Task Summary Report', content)
  }

  // Generate fleet utilization report
  const generateFleetUtilizationReport = (reportFormat: string) => {
    if (!aircraft || aircraft.length === 0) {
      toast.error('No aircraft data available')
      return
    }

    if (reportFormat === 'CSV') {
      exportToCSV(aircraft, 'fleet-utilization', [
        { key: 'tail_number', header: 'Tail Number' },
        { key: 'model', header: 'Model' },
        { key: 'status', header: 'Status' },
        { key: 'flight_hours_total', header: 'Total Flight Hours', format: (v) => String(v ?? 0) },
        { key: 'cycles_total', header: 'Total Cycles', format: (v) => String(v ?? 0) },
        { key: 'capacity_slots', header: 'Capacity Slots' },
      ])
      toast.success('Fleet Utilization Report exported as CSV')
    } else {
      const content = generateFleetUtilizationPDFContent(aircraft)
      printReport('Fleet Utilization Report', content)
    }
  }

  const handleGenerateReport = async (report: ReportTemplate) => {
    const reportFormat = selectedFormat[report.id] || report.formats[0]
    setGeneratingReport(report.id)

    try {
      // Small delay for UI feedback
      await new Promise((resolve) => setTimeout(resolve, 300))

      switch (report.id) {
        case 'fleet-status':
          generateFleetReport(reportFormat)
          break
        case 'maintenance-history':
          generateMaintenanceReport(reportFormat, false)
          break
        case 'upcoming-maintenance':
          generateMaintenanceReport(reportFormat, true)
          break
        case 'overdue-tasks':
          generateOverdueReport(reportFormat)
          break
        case 'parts-inventory':
          generatePartsReport(reportFormat)
          break
        case 'compliance-status':
          generateComplianceReport(reportFormat)
          break
        case 'task-summary':
          generateTaskSummaryReport()
          break
        case 'fleet-utilization':
          generateFleetUtilizationReport(reportFormat)
          break
        default:
          toast.error('Report type not implemented')
      }
    } catch (error) {
      toast.error('Failed to generate report')
      console.error('Report generation error:', error)
    } finally {
      setGeneratingReport(null)
    }
  }

  const handleExportAll = async () => {
    if (isDemo) {
      toast.error('Export not available in demo mode')
      return
    }

    toast.info('Generating all reports...', {
      description: 'This may take a few moments',
    })

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Export all available data as CSV
      if (aircraft && aircraft.length > 0) {
        generateFleetReport('CSV')
      }
      if (tasks && tasks.length > 0) {
        generateMaintenanceReport('CSV', false)
      }
      if (partItems && partItems.length > 0) {
        generatePartsReport('CSV')
      }

      toast.success('All reports generated', {
        description: 'CSV files have been downloaded',
      })
    } catch (error) {
      toast.error('Failed to export all reports')
    }
  }

  // Calculate stats from real data
  const stats = {
    total: reportTemplates.length,
    fleet: reportTemplates.filter((r) => r.category === 'fleet').length,
    maintenance: reportTemplates.filter((r) => r.category === 'maintenance').length,
    compliance: reportTemplates.filter((r) => r.category === 'compliance').length,
  }

  // Data availability stats
  const dataStats = {
    aircraft: aircraft?.length || 0,
    tasks: tasks?.length || 0,
    parts: partItems?.length || 0,
    scheduled: reportSummary?.tasks?.scheduled || 0,
    inProgress: reportSummary?.tasks?.in_progress || 0,
    completed: reportSummary?.tasks?.completed || 0,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and export maintenance reports
            {isDemo && <span className="ml-2 text-xs text-amber-600">(Demo Mode)</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={refetchAll} disabled={isDemo || isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleExportAll} disabled={isDemo || isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
        </div>
      </div>

      {/* Demo Mode Alert */}
      {isDemo && (
        <Alert>
          <AlertDescription>
            Reports are available in demo mode with sample data. Log in to generate reports from your actual data.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Print Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Quick Print
          </CardTitle>
          <CardDescription>Print common reports directly</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <PrintButton title="Fleet Status Report">
            <FleetStatusReportContent />
          </PrintButton>
          <PrintButton title="Maintenance Report">
            <MaintenanceReportContent />
          </PrintButton>
          <PrintButton title="Compliance Report">
            <ComplianceReportContent />
          </PrintButton>
        </CardContent>
      </Card>

      {/* Data Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Aircraft
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{dataStats.aircraft}</div>
            )}
            <p className="text-xs text-muted-foreground">In fleet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{dataStats.tasks}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {dataStats.scheduled} scheduled, {dataStats.inProgress} in progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Parts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{dataStats.parts}</div>
            )}
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Report Templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Available reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <Label>Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="fleet">Fleet</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="inventory">Inventory</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.map((report) => {
          const Icon = report.icon
          const currentFormat = selectedFormat[report.id] || report.formats[0]
          const isGenerating = generatingReport === report.id

          return (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{report.title}</CardTitle>
                      <Badge className={`mt-1 ${categoryColors[report.category]}`}>
                        {report.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {report.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Separator className="mb-4" />
                <div className="flex items-center gap-3">
                  <Select
                    value={currentFormat}
                    onValueChange={(value) =>
                      setSelectedFormat({ ...selectedFormat, [report.id]: value })
                    }
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {report.formats.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    className="flex-1"
                    onClick={() => handleGenerateReport(report)}
                    disabled={isGenerating || (isDemo && report.id !== 'task-summary')}
                  >
                    {isGenerating ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// PDF Content Generators
function generateFleetPDFContent(aircraft: ApiAircraft[]): string {
  const operational = aircraft.filter((a) => a.status === 'operational').length
  const maintenance = aircraft.filter((a) => a.status === 'maintenance').length
  const grounded = aircraft.filter((a) => a.status === 'grounded').length

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${aircraft.length}</div>
        <div class="label">Total Aircraft</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #16a34a;">${operational}</div>
        <div class="label">Operational</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #ca8a04;">${maintenance}</div>
        <div class="label">In Maintenance</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #dc2626;">${grounded}</div>
        <div class="label">Grounded</div>
      </div>
    </div>

    <div class="section">
      <h2>Aircraft Details</h2>
      <table>
        <thead>
          <tr>
            <th>Tail Number</th>
            <th>Model</th>
            <th>Status</th>
            <th>Flight Hours</th>
            <th>Cycles</th>
            <th>Last Maintenance</th>
            <th>Next Due</th>
          </tr>
        </thead>
        <tbody>
          ${aircraft.map((ac) => `
            <tr>
              <td><strong>${ac.tail_number}</strong></td>
              <td>${ac.model}</td>
              <td><span class="status-badge status-${ac.status}">${ac.status}</span></td>
              <td>${ac.flight_hours_total || 0}</td>
              <td>${ac.cycles_total || 0}</td>
              <td>${ac.last_maintenance ? format(new Date(ac.last_maintenance), 'MMM d, yyyy') : '-'}</td>
              <td>${ac.next_due ? format(new Date(ac.next_due), 'MMM d, yyyy') : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

function generateTasksPDFContent(tasks: ApiTask[], aircraft: ApiAircraft[], scheduledOnly: boolean): string {
  const getAircraftTail = (id: string) => aircraft.find((a) => a.id === id)?.tail_number || 'Unknown'

  return `
    <div class="section">
      <h2>${scheduledOnly ? 'Scheduled Tasks' : 'All Maintenance Tasks'} (${tasks.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Aircraft</th>
            <th>Type</th>
            <th>Status</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map((task) => `
            <tr>
              <td><strong>${getAircraftTail(task.aircraft_id)}</strong></td>
              <td>${task.type}</td>
              <td><span class="status-badge status-${task.state}">${task.state.replace('_', ' ')}</span></td>
              <td>${format(new Date(task.start_time), 'MMM d, yyyy')}</td>
              <td>${format(new Date(task.end_time), 'MMM d, yyyy')}</td>
              <td>${task.notes || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

function generateOverduePDFContent(tasks: ApiTask[], aircraft: ApiAircraft[]): string {
  const getAircraftTail = (id: string) => aircraft.find((a) => a.id === id)?.tail_number || 'Unknown'

  return `
    <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
      <strong style="color: #991b1b;">Attention Required:</strong> ${tasks.length} task(s) are overdue and require immediate attention.
    </div>

    <div class="section">
      <h2>Overdue Tasks</h2>
      <table>
        <thead>
          <tr>
            <th>Aircraft</th>
            <th>Type</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Days Overdue</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map((task) => {
            const daysOverdue = Math.floor((Date.now() - new Date(task.end_time).getTime()) / (1000 * 60 * 60 * 24))
            return `
              <tr>
                <td><strong>${getAircraftTail(task.aircraft_id)}</strong></td>
                <td>${task.type}</td>
                <td><span class="status-badge status-${task.state}">${task.state.replace('_', ' ')}</span></td>
                <td>${format(new Date(task.end_time), 'MMM d, yyyy')}</td>
                <td style="color: #dc2626; font-weight: bold;">${daysOverdue} days</td>
                <td>${task.notes || '-'}</td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    </div>
  `
}

function generatePartsPDFContent(parts: ApiPartItem[], defMap: Map<string, ApiPartDefinition>): string {
  const inStock = parts.filter((p) => p.status === 'in_stock').length
  const used = parts.filter((p) => p.status === 'used').length
  const disposed = parts.filter((p) => p.status === 'disposed').length

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${parts.length}</div>
        <div class="label">Total Parts</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #16a34a;">${inStock}</div>
        <div class="label">In Stock</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #2563eb;">${used}</div>
        <div class="label">Used</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #6b7280;">${disposed}</div>
        <div class="label">Disposed</div>
      </div>
    </div>

    <div class="section">
      <h2>Parts Inventory</h2>
      <table>
        <thead>
          <tr>
            <th>Serial Number</th>
            <th>Part Name</th>
            <th>Category</th>
            <th>Status</th>
            <th>Expiry Date</th>
          </tr>
        </thead>
        <tbody>
          ${parts.map((part) => {
            const def = defMap.get(part.part_definition_id)
            return `
              <tr>
                <td><code>${part.serial_number}</code></td>
                <td>${def?.name || 'Unknown'}</td>
                <td>${def?.category || 'Unknown'}</td>
                <td>${part.status.replace('_', ' ')}</td>
                <td>${part.expiry_date ? format(new Date(part.expiry_date), 'MMM d, yyyy') : '-'}</td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    </div>
  `
}

function generateCompliancePDFContent(items: { description: string; result: string; signed_off: boolean }[]): string {
  const pass = items.filter((i) => i.result === 'pass').length
  const fail = items.filter((i) => i.result === 'fail').length
  const pending = items.filter((i) => i.result === 'pending').length
  const signedOff = items.filter((i) => i.signed_off).length

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${items.length}</div>
        <div class="label">Total Items</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #16a34a;">${pass}</div>
        <div class="label">Pass</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #dc2626;">${fail}</div>
        <div class="label">Fail</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #ca8a04;">${pending}</div>
        <div class="label">Pending</div>
      </div>
    </div>

    <div class="section">
      <h2>Compliance Items (${signedOff} of ${items.length} signed off)</h2>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Result</th>
            <th>Signed Off</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item) => `
            <tr>
              <td>${item.description}</td>
              <td>${item.result}</td>
              <td>${item.signed_off ? 'Yes' : 'No'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

function generateTaskSummaryPDFContent(tasks: ApiTask[], summary?: { tasks?: { scheduled: number; in_progress: number; completed: number; cancelled: number } } | null): string {
  const byType = tasks.reduce((acc, task) => {
    acc[task.type] = (acc[task.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${tasks.length}</div>
        <div class="label">Total Tasks</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #2563eb;">${summary?.tasks?.scheduled || 0}</div>
        <div class="label">Scheduled</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #ca8a04;">${summary?.tasks?.in_progress || 0}</div>
        <div class="label">In Progress</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color: #16a34a;">${summary?.tasks?.completed || 0}</div>
        <div class="label">Completed</div>
      </div>
    </div>

    <div class="section">
      <h2>Tasks by Type</h2>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(byType).map(([type, count]) => `
            <tr>
              <td>${type}</td>
              <td>${count}</td>
              <td>${((count / tasks.length) * 100).toFixed(1)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

function generateFleetUtilizationPDFContent(aircraft: ApiAircraft[]): string {
  const totalHours = aircraft.reduce((sum, a) => sum + (a.flight_hours_total || 0), 0)
  const totalCycles = aircraft.reduce((sum, a) => sum + (a.cycles_total || 0), 0)
  const avgHours = aircraft.length > 0 ? (totalHours / aircraft.length).toFixed(1) : 0

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${aircraft.length}</div>
        <div class="label">Aircraft</div>
      </div>
      <div class="stat-card">
        <div class="value">${totalHours.toLocaleString()}</div>
        <div class="label">Total Flight Hours</div>
      </div>
      <div class="stat-card">
        <div class="value">${totalCycles.toLocaleString()}</div>
        <div class="label">Total Cycles</div>
      </div>
      <div class="stat-card">
        <div class="value">${avgHours}</div>
        <div class="label">Avg Hours/Aircraft</div>
      </div>
    </div>

    <div class="section">
      <h2>Fleet Utilization Details</h2>
      <table>
        <thead>
          <tr>
            <th>Tail Number</th>
            <th>Model</th>
            <th>Status</th>
            <th>Flight Hours</th>
            <th>Cycles</th>
            <th>Capacity Slots</th>
          </tr>
        </thead>
        <tbody>
          ${aircraft.map((ac) => `
            <tr>
              <td><strong>${ac.tail_number}</strong></td>
              <td>${ac.model}</td>
              <td><span class="status-badge status-${ac.status}">${ac.status}</span></td>
              <td>${(ac.flight_hours_total || 0).toLocaleString()}</td>
              <td>${(ac.cycles_total || 0).toLocaleString()}</td>
              <td>${ac.capacity_slots}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}
