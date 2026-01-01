export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'status_change'
  | 'state_change'
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

export interface AuditChange {
  field: string
  oldValue: unknown
  newValue: unknown
}

export interface AuditLogEntry {
  id: string
  action: AuditAction
  resource: AuditResource
  resourceId: string
  resourceName: string
  userId: string
  userName: string
  userEmail: string
  changes?: AuditChange[]
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

// Helper to check if a string is a valid AuditAction
export function isValidAuditAction(action: string): action is AuditAction {
  const validActions: AuditAction[] = [
    'create', 'update', 'delete', 'login', 'logout',
    'status_change', 'state_change', 'assign', 'unassign',
    'approve', 'reject', 'export', 'import'
  ]
  return validActions.includes(action as AuditAction)
}

// Helper to check if a string is a valid AuditResource
export function isValidAuditResource(resource: string): resource is AuditResource {
  const validResources: AuditResource[] = [
    'aircraft', 'task', 'part', 'user', 'team',
    'compliance', 'report', 'settings', 'notification'
  ]
  return validResources.includes(resource as AuditResource)
}
