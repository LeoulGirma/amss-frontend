import { useNavigate } from 'react-router'
import { formatDistanceToNow } from 'date-fns'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/app/store'
import { markAsRead, markAllAsRead, removeNotification } from './notifications-slice'
import type { Notification, NotificationType, NotificationPriority } from '@/types/notification'

const typeIcons: Record<NotificationType, React.ReactNode> = {
  maintenance_due: <Wrench className="h-4 w-4" />,
  task_assigned: <UserPlus className="h-4 w-4" />,
  task_completed: <Check className="h-4 w-4" />,
  part_low_stock: <Package className="h-4 w-4" />,
  compliance_expiring: <ShieldCheck className="h-4 w-4" />,
  aircraft_status: <Plane className="h-4 w-4" />,
  system: <AlertTriangle className="h-4 w-4" />,
}

const priorityColors: Record<NotificationPriority, string> = {
  low: 'bg-muted',
  medium: 'bg-blue-500',
  high: 'bg-yellow-500',
  critical: 'bg-red-500',
}

function NotificationItem({
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
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 hover:bg-accent cursor-pointer transition-colors',
        !notification.read && 'bg-accent/50'
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          notification.read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
        )}
      >
        {typeIcons[notification.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn('text-sm font-medium truncate', !notification.read && 'text-foreground')}>
            {notification.title}
          </p>
          <div className={cn('h-2 w-2 rounded-full shrink-0', priorityColors[notification.priority])} />
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              onRead()
            }}
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

export function NotificationsDropdown() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { notifications, unreadCount } = useAppSelector((state) => state.notifications)

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      dispatch(markAsRead(notification.id))
    }
    if (notification.link) {
      navigate(notification.link)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => dispatch(markAllAsRead())}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={() => dispatch(markAsRead(notification.id))}
                onRemove={() => dispatch(removeNotification(notification.id))}
                onClick={() => handleNotificationClick(notification)}
              />
            ))
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-primary cursor-pointer"
              onClick={() => navigate('/notifications')}
            >
              View All Notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
