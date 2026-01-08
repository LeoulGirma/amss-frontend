import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import {
  Plane,
  Wrench,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Plus,
  Calendar,
  FileText,
  Users,
  Package,
  TrendingUp,
  Clock,
  ArrowRight,
  Activity,
  Target,
  Zap,
} from 'lucide-react'
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
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartSkeleton, PieChartSkeleton, AreaChartSkeleton } from '@/components/loading-states'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AircraftStatusBadge } from '@/components/aircraft-status-badge'
import { useAppSelector } from '@/app/store'
import { useGetReportSummaryQuery, useGetTasksQuery, useGetAircraftListQuery, useGetAuditLogsQuery } from '@/lib/api'
import { formatDistanceToNow, startOfWeek, endOfWeek, isWithinInterval, differenceInHours, subMonths, format } from 'date-fns'

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
  { id: '1', tailNumber: 'N12345', type: 'C-Check', dueIn: '48 hours', aircraft: 'Boeing 737-800', priority: 'high' },
  { id: '2', tailNumber: 'N67890', type: 'Engine Inspection', dueIn: '5 days', aircraft: 'Airbus A320', priority: 'medium' },
  { id: '3', tailNumber: 'N11111', type: 'Landing Gear Service', dueIn: '7 days', aircraft: 'Boeing 777-300', priority: 'low' },
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

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export function DashboardPage() {
  const navigate = useNavigate()
  const { orgId, isAuthenticated } = useAppSelector((state) => state.auth)
  const isDemo = !isAuthenticated || !orgId

  // API queries (skipped in demo mode)
  const { data: reportSummary, isLoading: isLoadingReport, refetch: refetchReport } = useGetReportSummaryQuery(
    {},
    { skip: isDemo }
  )
  const { data: tasks, isLoading: isLoadingTasks, refetch: refetchTasks } = useGetTasksQuery(
    { limit: 30 },
    { skip: isDemo }
  )
  const { data: aircraft, isLoading: isLoadingAircraft, refetch: refetchAircraft } = useGetAircraftListQuery(
    {},
    { skip: isDemo }
  )
  const { data: auditLogs, isLoading: isLoadingAudit, refetch: refetchAudit } = useGetAuditLogsQuery(
    { limit: 10 },
    { skip: isDemo }
  )

  const isLoading = isLoadingReport || isLoadingTasks || isLoadingAircraft || isLoadingAudit
  const isFetching = isLoading

  const handleRefresh = () => {
    if (!isDemo) {
      refetchReport()
      refetchTasks()
      refetchAircraft()
      refetchAudit()
    }
  }

  // Calculate overdue tasks
  const now = new Date()
  const overdueTasks = isDemo ? 0 : (tasks || []).filter(t => {
    if (t.state === 'completed' || t.state === 'cancelled') return false
    const endTime = new Date(t.end_time)
    return endTime < now
  }).length

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (isDemo) {
      return {
        onTimeRate: 94,
        avgCompletionTime: 4.2,
        utilizationRate: 87,
        tasksTrend: 12,
      }
    }

    const taskList = tasks || []
    const completedTasks = taskList.filter(t => t.state === 'completed')

    // On-time completion rate
    const onTimeTasks = completedTasks.filter(t => {
      const endTime = new Date(t.end_time)
      const completedTime = t.updated_at ? new Date(t.updated_at) : endTime
      return completedTime <= endTime
    })
    const onTimeRate = completedTasks.length > 0
      ? Math.round((onTimeTasks.length / completedTasks.length) * 100)
      : 100

    // Average completion time (hours)
    const completionTimes = completedTasks.map(t => {
      const start = new Date(t.start_time)
      const end = t.updated_at ? new Date(t.updated_at) : new Date(t.end_time)
      return differenceInHours(end, start)
    })
    const avgCompletionTime = completionTimes.length > 0
      ? Math.round((completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length) * 10) / 10
      : 0

    // Fleet utilization (operational / total)
    const aircraftList = aircraft || []
    const operationalCount = aircraftList.filter(a => a.status === 'operational').length
    const utilizationRate = aircraftList.length > 0
      ? Math.round((operationalCount / aircraftList.length) * 100)
      : 0

    // Tasks trend (% change from last week)
    const thisWeekStart = startOfWeek(now)
    const thisWeekEnd = endOfWeek(now)
    const lastWeekStart = startOfWeek(subMonths(now, 0.25))
    const lastWeekEnd = endOfWeek(subMonths(now, 0.25))

    const thisWeekTasks = taskList.filter(t =>
      isWithinInterval(new Date(t.start_time), { start: thisWeekStart, end: thisWeekEnd })
    ).length
    const lastWeekTasks = taskList.filter(t =>
      isWithinInterval(new Date(t.start_time), { start: lastWeekStart, end: lastWeekEnd })
    ).length || 1

    const tasksTrend = Math.round(((thisWeekTasks - lastWeekTasks) / lastWeekTasks) * 100)

    return { onTimeRate, avgCompletionTime, utilizationRate, tasksTrend }
  }, [isDemo, tasks, aircraft])

  // Calculate stats from API data or use mock data
  const stats = isDemo ? mockStats : {
    totalAircraft: reportSummary?.aircraft.total || 0,
    operational: aircraft?.filter(a => a.status === 'operational').length || 0,
    inMaintenance: aircraft?.filter(a => a.status === 'maintenance').length || 0,
    grounded: aircraft?.filter(a => a.status === 'grounded').length || 0,
    pendingTasks: (reportSummary?.tasks.scheduled || 0) + (reportSummary?.tasks.in_progress || 0),
    overdueTasks,
    completedToday: reportSummary?.tasks.completed || 0,
  }

  // Build activity data from audit logs
  const recentActivity = isDemo
    ? mockRecentActivity
    : (auditLogs || []).slice(0, 5).map(log => {
        const actionMap: Record<string, string> = {
          'create': 'Created',
          'update': 'Updated',
          'delete': 'Deleted',
          'state_change': 'Status Changed',
        }
        const entityMap: Record<string, string> = {
          'aircraft': 'Aircraft',
          'maintenance_task': 'Task',
          'part_item': 'Part',
          'user': 'User',
          'compliance_item': 'Compliance',
        }

        const action = actionMap[log.action] || log.action
        const entity = entityMap[log.entity_type] || log.entity_type
        const resourceName = log.details?.resource_name || log.entity_id.slice(0, 8)

        return {
          id: log.id,
          action: `${entity} ${action}`,
          description: String(resourceName),
          time: formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }),
          user: log.user_id.slice(0, 8) + '...',
        }
      })

  // Build weekly task data from tasks
  const weeklyTaskData = useMemo(() => {
    if (isDemo) return weeklyTasks

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()
    const dayStats = days.map(day => ({ day, completed: 0, scheduled: 0 }))

    const taskList = tasks || []
    taskList.forEach(task => {
      const taskDate = new Date(task.start_time)
      const dayOfWeek = taskDate.getDay()
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      if (taskDate >= weekAgo && taskDate <= today) {
        if (task.state === 'completed') {
          dayStats[dayOfWeek].completed++
        }
        dayStats[dayOfWeek].scheduled++
      }
    })

    return [...dayStats.slice(1), dayStats[0]]
  }, [isDemo, tasks])

  // Build fleet utilization trend
  const fleetUtilizationData = useMemo(() => {
    if (isDemo || !aircraft) {
      return [
        { month: 'Jul', utilization: 82 },
        { month: 'Aug', utilization: 85 },
        { month: 'Sep', utilization: 78 },
        { month: 'Oct', utilization: 88 },
        { month: 'Nov', utilization: 91 },
        { month: 'Dec', utilization: 87 },
      ]
    }

    // Generate last 6 months of utilization data
    const months = []
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i)
      const monthName = format(date, 'MMM')
      // Calculate based on current fleet status (simplified)
      const operationalCount = aircraft.filter(a => a.status === 'operational').length
      const total = aircraft.length || 1
      const baseUtilization = Math.round((operationalCount / total) * 100)
      // Add some variance for historical months
      const variance = i > 0 ? Math.floor(Math.random() * 10) - 5 : 0
      months.push({
        month: monthName,
        utilization: Math.min(100, Math.max(60, baseUtilization + variance)),
      })
    }
    return months
  }, [isDemo, aircraft])

  // Build upcoming maintenance from tasks
  const upcomingMaintenance = useMemo(() => {
    if (isDemo) return mockUpcomingMaintenance

    return (tasks || [])
      .filter(t => t.state !== 'completed' && t.state !== 'cancelled')
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 4)
      .map((task) => {
        const taskAircraft = aircraft?.find(a => a.id === task.aircraft_id)
        const startDate = new Date(task.start_time)
        const hoursUntil = Math.round((startDate.getTime() - now.getTime()) / (1000 * 60 * 60))
        let dueIn = 'Now'
        let priority: 'high' | 'medium' | 'low' = 'low'

        if (hoursUntil <= 0) {
          dueIn = 'Overdue'
          priority = 'high'
        } else if (hoursUntil <= 24) {
          dueIn = `${hoursUntil}h`
          priority = 'high'
        } else if (hoursUntil <= 72) {
          dueIn = `${Math.round(hoursUntil / 24)}d`
          priority = 'medium'
        } else {
          dueIn = `${Math.round(hoursUntil / 24)}d`
          priority = 'low'
        }

        return {
          id: task.id,
          tailNumber: taskAircraft?.tail_number || 'Unknown',
          type: task.type.charAt(0).toUpperCase() + task.type.slice(1),
          dueIn,
          aircraft: taskAircraft?.model || 'Unknown',
          priority,
        }
      })
  }, [isDemo, tasks, aircraft])

  // Build maintenance by type pie chart data
  const pieData = useMemo(() => {
    if (isDemo) return maintenanceByType
    return [
      { name: 'Inspection', count: tasks?.filter(t => t.type === 'inspection').length || 0, color: '#22c55e' },
      { name: 'Repair', count: tasks?.filter(t => t.type === 'repair').length || 0, color: '#3b82f6' },
      { name: 'Overhaul', count: tasks?.filter(t => t.type === 'overhaul').length || 0, color: '#f59e0b' },
    ]
  }, [isDemo, tasks])

  // Quick actions
  const quickActions = [
    { icon: Plus, label: 'New Task', path: '/maintenance', color: 'bg-blue-500' },
    { icon: Plane, label: 'Add Aircraft', path: '/fleet', color: 'bg-emerald-500' },
    { icon: Calendar, label: 'Schedule', path: '/calendar', color: 'bg-purple-500' },
    { icon: FileText, label: 'Reports', path: '/reports', color: 'bg-amber-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Fleet overview and maintenance status
            {isDemo && <span className="ml-2 text-xs text-amber-600">(Demo Data)</span>}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isDemo || isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="group relative overflow-hidden rounded-xl border bg-card p-4 text-left transition-all hover:shadow-lg hover:border-primary/50"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${action.color} text-white`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">Quick access</p>
              </div>
            </div>
            <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
          </button>
        ))}
      </div>

      {/* KPI Cards - Clickable */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => navigate('/fleet')}
        >
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

        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
          onClick={() => navigate('/maintenance')}
        >
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

        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-red-500/50"
          onClick={() => navigate('/maintenance?filter=overdue')}
        >
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

        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-green-500/50"
          onClick={() => navigate('/maintenance?filter=completed')}
        >
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

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">On-Time Rate</span>
              </div>
              <span className="text-2xl font-bold">{performanceMetrics.onTimeRate}%</span>
            </div>
            <Progress value={performanceMetrics.onTimeRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Tasks completed on schedule</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Avg. Completion</span>
              </div>
              <span className="text-2xl font-bold">{performanceMetrics.avgCompletionTime}h</span>
            </div>
            <Progress value={Math.min(100, (performanceMetrics.avgCompletionTime / 8) * 100)} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Average task duration</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Fleet Utilization</span>
              </div>
              <span className="text-2xl font-bold">{performanceMetrics.utilizationRate}%</span>
            </div>
            <Progress value={performanceMetrics.utilizationRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">Operational aircraft</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Tasks Trend</span>
              </div>
              <span className={`text-2xl font-bold ${performanceMetrics.tasksTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {performanceMetrics.tasksTrend >= 0 ? '+' : ''}{performanceMetrics.tasksTrend}%
              </span>
            </div>
            <Progress value={50 + performanceMetrics.tasksTrend / 2} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">vs. last week</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Weekly Tasks Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Weekly Task Overview</CardTitle>
              <CardDescription>Completed vs scheduled tasks this week</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/maintenance')}>
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading && !isDemo ? (
              <ChartSkeleton height={300} />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTaskData}>
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
            )}
          </CardContent>
        </Card>

        {/* Maintenance by Type Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance by Type</CardTitle>
            <CardDescription>Distribution of maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !isDemo ? (
              <PieChartSkeleton size={200} />
            ) : (
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
                      <span className="text-xs text-muted-foreground">{item.name} ({item.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fleet Utilization Area Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Fleet Utilization Trend</CardTitle>
            <CardDescription>Monthly fleet availability percentage</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
            Full Report <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && !isDemo ? (
            <AreaChartSkeleton height={250} />
          ) : (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fleetUtilizationData}>
                  <defs>
                    <linearGradient id="utilizationGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis domain={[60, 100]} className="text-xs" tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`${value}%`, 'Utilization']}
                  />
                  <Area
                    type="monotone"
                    dataKey="utilization"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#utilizationGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Maintenance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Maintenance</CardTitle>
              <CardDescription>Scheduled maintenance tasks due soon</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')}>
              Calendar <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
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
              <div className="space-y-3">
                {upcomingMaintenance.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No upcoming maintenance scheduled
                  </p>
                ) : (
                  upcomingMaintenance.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/maintenance')}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{item.tailNumber}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.aircraft}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'}
                          className="font-mono"
                        >
                          {item.dueIn}
                        </Badge>
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions across the system</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/audit')}>
              Audit Log <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingAudit && !isDemo ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="mt-1 h-2 w-2 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No recent activity
              </p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((item, index) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className={`mt-1.5 h-2 w-2 rounded-full ${index === 0 ? 'bg-primary animate-pulse' : 'bg-muted-foreground/50'}`} />
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{isDemo ? '12' : (aircraft?.length || 0)}</p>
                <p className="text-xs text-muted-foreground">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Package className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{isDemo ? '847' : '—'}</p>
                <p className="text-xs text-muted-foreground">Parts in Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Zap className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{isDemo ? '99.9%' : `${performanceMetrics.utilizationRate}%`}</p>
                <p className="text-xs text-muted-foreground">System Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <FileText className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{isDemo ? '156' : (tasks?.length || 0)}</p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
