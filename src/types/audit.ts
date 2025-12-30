export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'status_change'
  | 'assign'
  | 'unassign'
  | 'approve'
  | 'reject'
  | 'export'
  | 'import'

export type AuditResource =
  | 'aircraft'
  | 'task'
  | 'part'
  | 'user'
  | 'team'
  | 'compliance'
  | 'report'
  | 'settings'
  | 'notification'

export interface AuditLogEntry {
  id: string
  action: AuditAction
  resource: AuditResource
  resourceId: string
  resourceName: string
  userId: string
  userName: string
  userEmail: string
  changes?: {
    field: string
    oldValue: unknown
    newValue: unknown
  }[]
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  timestamp: string
}
