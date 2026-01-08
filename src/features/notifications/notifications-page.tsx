import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { formatDistanceToNow, format } from 'date-fns'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Wrench,
  Package,
  ShieldCheck,
  Plane,
  UserPlus,
  AlertTriangle,
  Filter,
  Search,
  BellOff,
  Settings,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/app/store'
import { markAsRead, markAllAsRead, removeNotification, clearAll } from './notifications-slice'
import type { Notification, NotificationType, NotificationPriority } from '@/types/notification'

const typeIcons: Record<NotificationType, React.ReactNode> = {
  maintenance_due: <Wrench className="h-5 w-5" />,
  task_assigned: <UserPlus className="h-5 w-5" />,
  task_completed: <Check className="h-5 w-5" />,
  part_low_stock: <Package className="h-5 w-5" />,
  compliance_expiring: <ShieldCheck className="h-5 w-5" />,
  aircraft_status: <Plane className="h-5 w-5" />,
  system: <AlertTriangle className="h-5 w-5" />,
}

const typeLabels: Record<NotificationType, string> = {
  maintenance_due: 'Maintenance Due',
  task_assigned: 'Task Assigned',
  task_completed: 'Task Completed',
  part_low_stock: 'Low Stock',
  compliance_expiring: 'Compliance',
  aircraft_status: 'Aircraft Status',
  system: 'System',
}

const priorityConfig: Record<NotificationPriority, { color: string; bg: string; label: string }> = {
  low: { color: 'text-muted-foreground', bg: 'bg-muted', label: 'Low' },
  medium: { color: 'text-blue-600', bg: 'bg-blue-500', label: 'Medium' },
  high: { color: 'text-amber-600', bg: 'bg-amber-500', label: 'High' },
  critical: { color: 'text-red-600', bg: 'bg-red-500', label: 'Critical' },
}

function NotificationCard({
  notification,
  onRead,
  onRemove,
  onClick,
}: {
  notification: Notification
  onRead: () => void
  onRemove: () => void
  onClick: () => void
}) {
  const priority = priorityConfig[notification.priority]

  return (
    <div
      className={cn(
        'group flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer',
        !notification.read
          ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
          : 'bg-card hover:bg-muted/50'
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          notification.read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
        )}
      >
        {typeIcons[notification.type]}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p className={cn('font-medium', !notification.read && 'text-foreground')}>
            {notification.title}
          </p>
          {!notification.read && (
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {notification.message}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
          <span>·</span>
          <Badge variant="outline" className={cn('text-xs', priority.color)}>
            {priority.label}
          </Badge>
          <span>·</span>
          <span>{typeLabels[notification.type]}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              onRead()
            }}
            title="Mark as read"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { notifications, unreadCount } = useAppSelector((state) => state.notifications)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | 'all'>('all')
  const [tab, setTab] = useState<'all' | 'unread'>('all')

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Tab filter
      if (tab === 'unread' && n.read) return false

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        if (
          !n.title.toLowerCase().includes(searchLower) &&
          !n.message.toLowerCase().includes(searchLower)
        ) {
          return false
        }
      }

      // Type filter
      if (typeFilter !== 'all' && n.type !== typeFilter) return false

      // Priority filter
      if (priorityFilter !== 'all' && n.priority !== priorityFilter) return false

      return true
    })
  }, [notifications, search, typeFilter, priorityFilter, tab])

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {}

    filteredNotifications.forEach((n) => {
      const date = format(new Date(n.createdAt), 'yyyy-MM-dd')
      const today = format(new Date(), 'yyyy-MM-dd')
      const yesterday = format(new Date(Date.now() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd')

      let label: string
      if (date === today) {
        label = 'Today'
      } else if (date === yesterday) {
        label = 'Yesterday'
      } else {
        label = format(new Date(n.createdAt), 'MMMM d, yyyy')
      }

      if (!groups[label]) {
        groups[label] = []
      }
      groups[label].push(n)
    })

    return groups
  }, [filteredNotifications])

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      dispatch(markAsRead(notification.id))
    }
    if (notification.link) {
      navigate(notification.link)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="default" className="text-lg px-3 py-1">
                  {unreadCount}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              Stay updated on maintenance tasks, alerts, and system events
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={() => dispatch(markAllAsRead())}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{unreadCount}</p>
                <p className="text-xs text-muted-foreground">Unread</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {notifications.filter(n => n.priority === 'high' || n.priority === 'critical').length}
                </p>
                <p className="text-xs text-muted-foreground">High Priority</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.read).length}
                </p>
                <p className="text-xs text-muted-foreground">Read</p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as NotificationType | 'all')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="maintenance_due">Maintenance Due</SelectItem>
                <SelectItem value="task_assigned">Task Assigned</SelectItem>
                <SelectItem value="task_completed">Task Completed</SelectItem>
                <SelectItem value="part_low_stock">Low Stock</SelectItem>
                <SelectItem value="compliance_expiring">Compliance</SelectItem>
                <SelectItem value="aircraft_status">Aircraft Status</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as NotificationPriority | 'all')}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            {notifications.length > 0 && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => dispatch(clearAll())}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Tabs value={tab} onValueChange={(v: string) => setTab(v as 'all' | 'unread')}>
        <TabsList>
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm text-muted-foreground">
                  {tab === 'unread'
                    ? "You're all caught up!"
                    : 'Notifications will appear here when there are updates'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedNotifications).map(([date, notifs]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
                  <div className="space-y-2">
                    {notifs.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onRead={() => dispatch(markAsRead(notification.id))}
                        onRemove={() => dispatch(removeNotification(notification.id))}
                        onClick={() => handleNotificationClick(notification)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
