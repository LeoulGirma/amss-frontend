export type NotificationType =
  | 'maintenance_due'
  | 'task_assigned'
  | 'task_completed'
  | 'part_low_stock'
  | 'compliance_expiring'
  | 'aircraft_status'
  | 'system'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  read: boolean
  link?: string
  createdAt: string
  metadata?: Record<string, unknown>
}
