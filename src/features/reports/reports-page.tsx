import { useState } from 'react'
import { toast } from 'sonner'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    formats: ['PDF', 'CSV', 'Excel'],
  },
  {
    id: 'maintenance-history',
    title: 'Maintenance History',
    description: 'Complete maintenance history for selected aircraft or entire fleet',
    icon: Wrench,
    category: 'maintenance',
    formats: ['PDF', 'CSV', 'Excel'],
  },
  {
    id: 'upcoming-maintenance',
    title: 'Upcoming Maintenance',
    description: 'Scheduled maintenance tasks for the next 30/60/90 days',
    icon: Calendar,
    category: 'maintenance',
    formats: ['PDF', 'CSV'],
  },
  {
    id: 'compliance-status',
    title: 'Compliance Status Report',
    description: 'Current compliance status for ADs, SBs, and inspections',
    icon: ShieldCheck,
    category: 'compliance',
    formats: ['PDF', 'CSV', 'Excel'],
  },
  {
    id: 'parts-inventory',
    title: 'Parts Inventory Report',
    description: 'Current inventory levels, low stock alerts, and usage trends',
    icon: Package,
    category: 'inventory',
    formats: ['PDF', 'CSV', 'Excel'],
  },
  {
    id: 'workload-analysis',
    title: 'Workload Analysis',
    description: 'Team workload distribution and task completion metrics',
    icon: BarChart3,
    category: 'maintenance',
    formats: ['PDF', 'Excel'],
  },
  {
    id: 'cost-analysis',
    title: 'Maintenance Cost Analysis',
    description: 'Cost breakdown by aircraft, maintenance type, and parts usage',
    icon: TrendingUp,
    category: 'maintenance',
    formats: ['PDF', 'Excel'],
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

  const filteredReports = selectedCategory === 'all'
    ? reportTemplates
    : reportTemplates.filter((r) => r.category === selectedCategory)

  const handleGenerateReport = async (report: ReportTemplate) => {
    const format = selectedFormat[report.id] || report.formats[0]
    setGeneratingReport(report.id)

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setGeneratingReport(null)
    toast.success(`${report.title} generated`, {
      description: `Downloaded as ${format} file`,
    })
  }

  const handleExportAll = async () => {
    toast.info('Generating all reports...', {
      description: 'This may take a few moments',
    })

    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast.success('All reports generated', {
      description: 'Reports have been downloaded as a ZIP file',
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and export maintenance reports
          </p>
        </div>
        <Button onClick={handleExportAll}>
          <Download className="mr-2 h-4 w-4" />
          Export All
        </Button>
      </div>

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

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available Reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportTemplates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fleet Reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportTemplates.filter((r) => r.category === 'fleet').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Maintenance Reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportTemplates.filter((r) => r.category === 'maintenance').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Compliance Reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportTemplates.filter((r) => r.category === 'compliance').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <Label>Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
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
                    disabled={isGenerating}
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

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Generated Reports</CardTitle>
          <CardDescription>Your last 5 generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Fleet Status Report', date: '2024-12-28 10:30 AM', format: 'PDF', size: '2.4 MB' },
              { name: 'Compliance Status Report', date: '2024-12-27 03:15 PM', format: 'Excel', size: '1.8 MB' },
              { name: 'Upcoming Maintenance', date: '2024-12-27 09:00 AM', format: 'CSV', size: '450 KB' },
              { name: 'Parts Inventory Report', date: '2024-12-26 02:45 PM', format: 'PDF', size: '3.2 MB' },
              { name: 'Workload Analysis', date: '2024-12-25 11:20 AM', format: 'Excel', size: '1.1 MB' },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{item.format}</Badge>
                  <span className="text-sm text-muted-foreground">{item.size}</span>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
