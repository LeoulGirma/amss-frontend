import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Mail,
  Building2,
  Calendar,
  Clock,
  Shield,
  Settings,
  Camera,
  CheckCircle,
  Wrench,
  Activity,
  TrendingUp,
  Award,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAppSelector } from '@/app/store'
import { useGetTasksQuery, useGetAuditLogsQuery } from '@/lib/api'

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrator', color: 'bg-purple-500' },
  tenant_admin: { label: 'Organization Admin', color: 'bg-blue-500' },
  scheduler: { label: 'Scheduler', color: 'bg-emerald-500' },
  mechanic: { label: 'Mechanic', color: 'bg-amber-500' },
  auditor: { label: 'Auditor', color: 'bg-slate-500' },
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, orgId } = useAppSelector((state) => state.auth)
  const isDemo = !isAuthenticated || !orgId

  // Fetch user's tasks and activity
  const { data: tasks } = useGetTasksQuery({ limit: 100 }, { skip: isDemo })
  const { data: auditLogs } = useGetAuditLogsQuery({ limit: 20 }, { skip: isDemo })

  // Extract user info
  const userEmail = user?.email || 'demo@amss.com'
  const userRole = user?.role || 'tenant_admin'
  const lastLogin = user?.last_login
  const createdAt = user?.created_at

  // Parse name from email
  const emailParts = userEmail.split('@')[0].split('.')
  const firstName = emailParts[0]?.charAt(0).toUpperCase() + (emailParts[0]?.slice(1) || '')
  const lastName = emailParts[1]?.charAt(0).toUpperCase() + (emailParts[1]?.slice(1) || '')
  const fullName = lastName ? `${firstName} ${lastName}` : firstName
  const initials = `${firstName.charAt(0)}${lastName?.charAt(0) || firstName.charAt(1) || ''}`.toUpperCase()

  const roleInfo = roleLabels[userRole] || { label: userRole, color: 'bg-gray-500' }

  // Calculate user statistics
  const stats = useMemo(() => {
    if (isDemo) {
      return {
        tasksCompleted: 47,
        tasksAssigned: 12,
        avgCompletionTime: 3.2,
        onTimeRate: 94,
        recentActions: 156,
      }
    }

    const userTasks = tasks?.filter(t => t.assigned_mechanic_id === user?.id) || []
    const completedTasks = userTasks.filter(t => t.state === 'completed')
    const pendingTasks = userTasks.filter(t => t.state !== 'completed' && t.state !== 'cancelled')

    const userActions = auditLogs?.filter(log => log.user_id === user?.id) || []

    return {
      tasksCompleted: completedTasks.length,
      tasksAssigned: pendingTasks.length,
      avgCompletionTime: completedTasks.length > 0 ? 4.5 : 0,
      onTimeRate: completedTasks.length > 0 ? 92 : 100,
      recentActions: userActions.length,
    }
  }, [isDemo, tasks, auditLogs, user?.id])

  // Recent activity
  const recentActivity = useMemo(() => {
    if (isDemo) {
      return [
        { id: '1', action: 'Completed task', target: 'A-Check for N12345', time: '2 hours ago' },
        { id: '2', action: 'Updated status', target: 'Engine Inspection', time: '4 hours ago' },
        { id: '3', action: 'Added comment', target: 'Landing Gear Service', time: '1 day ago' },
        { id: '4', action: 'Assigned to task', target: 'C-Check for N67890', time: '2 days ago' },
        { id: '5', action: 'Completed task', target: 'Routine Inspection', time: '3 days ago' },
      ]
    }

    return (auditLogs || [])
      .filter(log => log.user_id === user?.id)
      .slice(0, 5)
      .map(log => ({
        id: log.id,
        action: `${log.action} ${log.entity_type}`,
        target: log.details?.resource_name || log.entity_id.slice(0, 8),
        time: formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }),
      }))
  }, [isDemo, auditLogs, user?.id])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            View and manage your account information
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative group">
                <Avatar className="h-24 w-24 text-2xl">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Change avatar (coming soon)"
                >
                  <Camera className="h-6 w-6 text-white" />
                </button>
              </div>

              {/* Name & Role */}
              <h2 className="mt-4 text-xl font-semibold">{fullName}</h2>
              <Badge className={`mt-2 ${roleInfo.color}`}>
                {roleInfo.label}
              </Badge>

              {/* Contact Info */}
              <div className="mt-6 w-full space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{userEmail}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {isDemo ? 'AMSS Demo Organization' : `Org: ${orgId?.slice(0, 8)}...`}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Joined {createdAt ? format(new Date(createdAt), 'MMM yyyy') : 'Jan 2024'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Last login: {lastLogin ? formatDistanceToNow(new Date(lastLogin), { addSuffix: true }) : 'Just now'}
                  </span>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Quick Actions */}
              <div className="w-full space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/notifications')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Notification Preferences
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{stats.tasksCompleted}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{stats.tasksAssigned}</p>
                    <p className="text-xs text-muted-foreground">Assigned</p>
                  </div>
                  <Wrench className="h-8 w-8 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stats.onTimeRate}%</p>
                    <p className="text-xs text-muted-foreground">On-Time</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stats.recentActions}</p>
                    <p className="text-xs text-muted-foreground">Actions</p>
                  </div>
                  <Activity className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Performance Overview
              </CardTitle>
              <CardDescription>Your contribution and performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Task Completion Rate</span>
                  <span className="font-medium">{stats.onTimeRate}%</span>
                </div>
                <Progress value={stats.onTimeRate} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>On-Time Delivery</span>
                  <span className="font-medium">{Math.round(stats.onTimeRate * 0.98)}%</span>
                </div>
                <Progress value={stats.onTimeRate * 0.98} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Quality Score</span>
                  <span className="font-medium">96%</span>
                </div>
                <Progress value={96} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Response Time</span>
                  <span className="font-medium">Excellent</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest actions in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`mt-1.5 h-2 w-2 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.action}</span>
                          {' '}
                          <span className="text-muted-foreground">{activity.target}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Badges / Achievements (for gamification) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Achievements
              </CardTitle>
              <CardDescription>Badges earned for your contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <span className="text-lg">🏆</span>
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Top Performer</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <span className="text-lg">⚡</span>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Quick Responder</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                  <span className="text-lg">✅</span>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">100% Compliance</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <span className="text-lg">🌟</span>
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-400">Team Player</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted border border-border">
                  <span className="text-lg opacity-50">🔒</span>
                  <span className="text-sm font-medium text-muted-foreground">Safety Expert</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
