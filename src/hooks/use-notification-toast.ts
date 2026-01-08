import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useAppSelector, useAppDispatch } from '@/app/store'
import { markAsRead } from '@/features/notifications'
import type { Notification, NotificationType } from '@/types/notification'

const typeEmoji: Record<NotificationType, string> = {
  maintenance_due: '🔧',
  task_assigned: '📋',
  task_completed: '✅',
  part_low_stock: '📦',
  compliance_expiring: '⚠️',
  aircraft_status: '✈️',
  system: '🔔',
}

export function useNotificationToast() {
  const dispatch = useAppDispatch()
  const { notifications } = useAppSelector((state) => state.notifications)
  const previousCount = useRef(notifications.length)
  const shownIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Only show toast for new notifications
    if (notifications.length > previousCount.current) {
      const newNotifications = notifications.slice(0, notifications.length - previousCount.current)

      newNotifications.forEach((notification: Notification) => {
        // Don't show toast if we've already shown it
        if (shownIds.current.has(notification.id)) return
        shownIds.current.add(notification.id)

        const emoji = typeEmoji[notification.type] || '🔔'

        if (notification.priority === 'critical') {
          toast.error(`${emoji} ${notification.title}`, {
            description: notification.message,
            duration: 10000,
            action: notification.link
              ? {
                  label: 'View',
                  onClick: () => {
                    dispatch(markAsRead(notification.id))
                    window.location.href = notification.link!
                  },
                }
              : undefined,
          })
        } else if (notification.priority === 'high') {
          toast.warning(`${emoji} ${notification.title}`, {
            description: notification.message,
            duration: 8000,
            action: notification.link
              ? {
                  label: 'View',
                  onClick: () => {
                    dispatch(markAsRead(notification.id))
                    window.location.href = notification.link!
                  },
                }
              : undefined,
          })
        } else {
          toast.info(`${emoji} ${notification.title}`, {
            description: notification.message,
            duration: 5000,
            action: notification.link
              ? {
                  label: 'View',
                  onClick: () => {
                    dispatch(markAsRead(notification.id))
                    window.location.href = notification.link!
                  },
                }
              : undefined,
          })
        }
      })
    }

    previousCount.current = notifications.length
  }, [notifications, dispatch])
}

// Helper function to show a manual notification toast
export function showNotificationToast(
  title: string,
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
  options?: {
    duration?: number
    action?: { label: string; onClick: () => void }
  }
) {
  const toastFn = {
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
  }[type]

  toastFn(title, {
    description: message,
    duration: options?.duration ?? 5000,
    action: options?.action,
  })
}
