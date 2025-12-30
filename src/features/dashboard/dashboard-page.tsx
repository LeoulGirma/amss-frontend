import { Plane, Wrench, AlertTriangle, CheckCircle } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AircraftStatusBadge } from '@/components/aircraft-status-badge'
import { useAppSelector } from '@/app/store'
import { useGetReportSummaryQuery, useGetTasksQuery, useGetAircraftListQuery } from '@/lib/api'

// Mock data for demo mode
const mockStats = {
  totalAircraft: 24,
  operational: 18,
  inMaintenance: 4,
  grounded: 2,
  pendingTasks: 12,
  overdueTasks: 3,
  completedToday: 8,
}

const mockUpcomingMaintenance = [
  { id: '1', tailNumber: 'N12345', type: 'C-Check', dueIn: '48 hours', aircraft: 'Boeing 737-800' },
  { id: '2', tailNumber: 'N67890', type: 'Engine Inspection', dueIn: '5 days', aircraft: 'Airbus A320' },
  { id: '3', tailNumber: 'N11111', type: 'Landing Gear Service', dueIn: '7 days', aircraft: 'Boeing 777-300' },
]

const mockRecentActivity = [
  { id: '1', action: 'Task Completed', description: 'N24680 - A-Check completed', time: '10 mins ago', user: 'Mike Johnson' },
  { id: '2', action: 'Part Reserved', description: 'Brake Assembly for N12345', time: '25 mins ago', user: 'Sarah Chen' },
  { id: '3', action: 'Aircraft Grounded', description: 'N98765 - AOG status', time: '1 hour ago', user: 'System' },
  { id: '4', action: 'Sign-off Approved', description: 'N67890 - Engine inspection', time: '2 hours ago', user: 'John Doe' },
]

// Chart data
const maintenanceByType = [
  { name: 'Inspection', count: 12, color: '#22c55e' },
  { name: 'Repair', count: 8, color: '#3b82f6' },
  { name: 'Overhaul', count: 4, color: '#f59e0b' },
]

const weeklyTasks = [
  { day: 'Mon', completed: 8, scheduled: 12 },
  { day: 'Tue', completed: 10, scheduled: 10 },
  { day: 'Wed', completed: 6, scheduled: 8 },
  { day: 'Thu', completed: 12, scheduled: 14 },
  { day: 'Fri', completed: 9, scheduled: 11 },
  { day: 'Sat', completed: 4, scheduled: 5 },
  { day: 'Sun', completed: 2, scheduled: 3 },
]

const fleetUtilization = [
  { month: 'Jul', utilization: 82 },
  { month: 'Aug', utilization: 85 },
  { month: 'Sep', utilization: 78 },
  { month: 'Oct', utilization: 88 },
  { month: 'Nov', utilization: 91 },
  { month: 'Dec', utilization: 87 },
]

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export function DashboardPage() {
  const { orgId } = useAppSelector((state) => state.auth)
  const isDemo = orgId === 'demo-org' || !orgId

  // API queries (skipped in demo mode)
  const { data: reportSummary, isLoading: isLoadingReport } = useGetReportSummaryQuery(
    {},
    { skip: isDemo }
  )
  const { data: tasks, isLoading: isLoadingTasks } = useGetTasksQuery(
    { state: 'scheduled', limit: 5 },
    { skip: isDemo }
  )
  const { data: aircraft, isLoading: isLoadingAircraft } = useGetAircraftListQuery(
    {},
    { skip: isDemo }
  )

  const isLoading = isLoadingReport || isLoadingTasks || isLoadingAircraft

  // Calculate stats from API data or use mock data
  const stats = isDemo ? mockStats : {
    totalAircraft: reportSummary?.aircraft.total || 0,
    operational: aircraft?.filter(a => a.status === 'operational').length || 0,
    inMaintenance: aircraft?.filter(a => a.status === 'maintenance').length || 0,
    grounded: aircraft?.filter(a => a.status === 'grounded').length || 0,
    pendingTasks: (reportSummary?.tasks.scheduled || 0) + (reportSummary?.tasks.in_progress || 0),
    overdueTasks: 0, // Would need additional logic to determine overdue
    completedToday: reportSummary?.tasks.completed || 0,
  }

  // Build upcoming maintenance from tasks
  const upcomingMaintenance = isDemo
    ? mockUpcomingMaintenance
    : (tasks || []).slice(0, 3).map((task) => {
        const taskAircraft = aircraft?.find(a => a.id === task.aircraft_id)
        const startDate = new Date(task.start_time)
        const now = new Date()
        const hoursUntil = Math.round((startDate.getTime() - now.getTime()) / (1000 * 60 * 60))
        let dueIn = 'Now'
        if (hoursUntil > 48) {
          dueIn = `${Math.round(hoursUntil / 24)} days`
        } else if (hoursUntil > 0) {
          dueIn = `${hoursUntil} hours`
        }
        return {
          id: task.id,
          tailNumber: taskAircraft?.tail_number || 'Unknown',
          type: task.type.charAt(0).toUpperCase() + task.type.slice(1),
          dueIn,
          aircraft: taskAircraft?.model || 'Unknown',
        }
      })

  // Build maintenance by type pie chart data from API
  const pieData = isDemo
    ? maintenanceByType
    : [
        { name: 'Inspection', count: tasks?.filter(t => t.type === 'inspection').length || 0, color: '#22c55e' },
        { name: 'Repair', count: tasks?.filter(t => t.type === 'repair').length || 0, color: '#3b82f6' },
        { name: 'Overhaul', count: tasks?.filter(t => t.type === 'overhaul').length || 0, color: '#f59e0b' },
      ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Fleet overview and maintenance status
          {isDemo && <span className="ml-2 text-xs text-amber-600">(Demo Data)</span>}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Aircraft</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && !isDemo ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalAircraft}</div>
                <div className="flex gap-2 mt-2">
                  <AircraftStatusBadge status="operational" size="sm">
                    {stats.operational}
                  </AircraftStatusBadge>
                  <AircraftStatusBadge status="maintenance" size="sm">
                    {stats.inMaintenance}
                  </AircraftStatusBadge>
                  <AircraftStatusBadge status="grounded" size="sm">
                    {stats.grounded}
                  </AircraftStatusBadge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && !isDemo ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.pendingTasks}</div>
                <p className="text-xs text-muted-foreground">
                  Scheduled for this week
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading && !isDemo ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-500">{stats.overdueTasks}</div>
                <p className="text-xs text-muted-foreground">
                  Require immediate attention
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading && !isDemo ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-500">{stats.completedToday}</div>
                <p className="text-xs text-muted-foreground">
                  Tasks completed
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Tasks Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Task Overview</CardTitle>
            <CardDescription>Completed vs scheduled tasks this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTasks}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="scheduled" name="Scheduled" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance by Type Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance by Type</CardTitle>
            <CardDescription>Distribution of maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 -mt-4">
                {pieData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Utilization Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Utilization Trend</CardTitle>
          <CardDescription>Monthly fleet availability percentage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fleetUtilization}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis domain={[70, 100]} className="text-xs" tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [`${value}%`, 'Utilization']}
                />
                <Line
                  type="monotone"
                  dataKey="utilization"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Maintenance</CardTitle>
            <CardDescription>Scheduled maintenance tasks due soon</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !isDemo ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingMaintenance.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No upcoming maintenance scheduled
                  </p>
                ) : (
                  upcomingMaintenance.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{item.tailNumber}</span>
                          <span className="text-sm text-muted-foreground">
                            {item.aircraft}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.type}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-amber-600">
                          Due in {item.dueIn}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.user} · {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
