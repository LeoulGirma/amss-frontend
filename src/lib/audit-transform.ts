import type { ApiAuditLog, ApiUser } from './api'
import type { AuditLogEntry, AuditAction, AuditResource, AuditChange } from '@/types/audit'
import { isValidAuditAction, isValidAuditResource } from '@/types/audit'

/**
 * Transform API audit log response to frontend AuditLogEntry format
 */
export function transformAuditLog(
  apiLog: ApiAuditLog,
  usersMap: Map<string, ApiUser>
): AuditLogEntry {
  // Get user info from cache
  const user = usersMap.get(apiLog.user_id)

  // Transform action (handle API variations)
  let action: AuditAction = 'update'
  if (isValidAuditAction(apiLog.action)) {
    action = apiLog.action
  } else if (apiLog.action === 'state_change') {
    action = 'state_change'
  }

  // Transform resource type
  let resource: AuditResource = 'task'
  if (isValidAuditResource(apiLog.entity_type)) {
    resource = apiLog.entity_type
  }

  // Transform changes array
  const changes: AuditChange[] | undefined = apiLog.details.changes?.map(change => ({
    field: change.field,
    oldValue: change.old_value,
    newValue: change.new_value,
  }))

  // Extract metadata (everything except resource_name and changes)
  const { resource_name, changes: _, ...metadata } = apiLog.details
  const hasMetadata = Object.keys(metadata).length > 0

  return {
    id: apiLog.id,
    action,
    resource,
    resourceId: apiLog.entity_id,
    resourceName: apiLog.details.resource_name || apiLog.entity_id,
    userId: apiLog.user_id,
    userName: user?.email?.split('@')[0] || 'Unknown User',
    userEmail: user?.email || 'unknown@example.com',
    changes: changes && changes.length > 0 ? changes : undefined,
    metadata: hasMetadata ? metadata : undefined,
    ipAddress: apiLog.ip_address || undefined,
    userAgent: apiLog.user_agent || undefined,
    timestamp: apiLog.timestamp,
  }
}

/**
 * Transform an array of API audit logs
 */
export function transformAuditLogs(
  apiLogs: ApiAuditLog[],
  users: ApiUser[]
): AuditLogEntry[] {
  // Create a map for quick user lookups
  const usersMap = new Map<string, ApiUser>()
  users.forEach(user => usersMap.set(user.id, user))

  return apiLogs.map(log => transformAuditLog(log, usersMap))
}

/**
 * Get display-friendly action label
 */
export function getActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    login: 'Logged In',
    logout: 'Logged Out',
    status_change: 'Status Changed',
    state_change: 'State Changed',
    assign: 'Assigned',
    unassign: 'Unassigned',
    approve: 'Approved',
    reject: 'Rejected',
    export: 'Exported',
    import: 'Imported',
  }
  return labels[action] || action
}

/**
 * Get display-friendly resource label
 */
export function getResourceLabel(resource: AuditResource): string {
  const labels: Record<AuditResource, string> = {
    aircraft: 'Aircraft',
    task: 'Task',
    part: 'Part',
    user: 'User',
    team: 'Team',
    compliance: 'Compliance',
    report: 'Report',
    settings: 'Settings',
    notification: 'Notification',
  }
  return labels[resource] || resource
}
