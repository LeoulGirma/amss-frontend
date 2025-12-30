import type { ApiUserRole } from '@/lib/api'

// Re-export the API user role type for convenience
export type UserRole = ApiUserRole

// Define all permissions in the system
export type Permission =
  | 'view:dashboard'
  | 'view:fleet'
  | 'manage:fleet'
  | 'view:maintenance'
  | 'manage:maintenance'
  | 'assign:tasks'
  | 'complete:tasks'
  | 'view:parts'
  | 'manage:parts'
  | 'order:parts'
  | 'view:team'
  | 'manage:team'
  | 'view:compliance'
  | 'manage:compliance'
  | 'view:reports'
  | 'export:reports'
  | 'view:settings'
  | 'manage:settings'
  | 'manage:organization'

// Role to permissions mapping (mapped to backend roles)
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'view:dashboard',
    'view:fleet',
    'manage:fleet',
    'view:maintenance',
    'manage:maintenance',
    'assign:tasks',
    'complete:tasks',
    'view:parts',
    'manage:parts',
    'order:parts',
    'view:team',
    'manage:team',
    'view:compliance',
    'manage:compliance',
    'view:reports',
    'export:reports',
    'view:settings',
    'manage:settings',
    'manage:organization',
  ],
  tenant_admin: [
    'view:dashboard',
    'view:fleet',
    'manage:fleet',
    'view:maintenance',
    'manage:maintenance',
    'assign:tasks',
    'complete:tasks',
    'view:parts',
    'manage:parts',
    'order:parts',
    'view:team',
    'manage:team',
    'view:compliance',
    'manage:compliance',
    'view:reports',
    'export:reports',
    'view:settings',
    'manage:settings',
  ],
  scheduler: [
    'view:dashboard',
    'view:fleet',
    'view:maintenance',
    'manage:maintenance',
    'assign:tasks',
    'complete:tasks',
    'view:parts',
    'order:parts',
    'view:team',
    'view:compliance',
    'manage:compliance',
    'view:reports',
    'export:reports',
    'view:settings',
  ],
  mechanic: [
    'view:dashboard',
    'view:fleet',
    'view:maintenance',
    'complete:tasks',
    'view:parts',
    'view:team',
    'view:compliance',
    'view:settings',
  ],
  auditor: [
    'view:dashboard',
    'view:fleet',
    'view:maintenance',
    'view:parts',
    'view:team',
    'view:compliance',
    'view:reports',
    'export:reports',
    'view:settings',
  ],
}

// Check if a role has a specific permission
export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false
  return rolePermissions[role]?.includes(permission) ?? false
}

// Check if a role has any of the specified permissions
export function hasAnyPermission(role: UserRole | undefined, permissions: Permission[]): boolean {
  if (!role) return false
  return permissions.some((p) => hasPermission(role, p))
}

// Check if a role has all of the specified permissions
export function hasAllPermissions(role: UserRole | undefined, permissions: Permission[]): boolean {
  if (!role) return false
  return permissions.every((p) => hasPermission(role, p))
}

// Get all permissions for a role
export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] ?? []
}

// Role display names
export const roleDisplayNames: Record<UserRole, string> = {
  admin: 'Super Admin',
  tenant_admin: 'Organization Admin',
  scheduler: 'Maintenance Scheduler',
  mechanic: 'Mechanic',
  auditor: 'Auditor',
}

// Role descriptions
export const roleDescriptions: Record<UserRole, string> = {
  admin: 'Full system access across all organizations',
  tenant_admin: 'Full access within organization',
  scheduler: 'Manage maintenance schedules and assign tasks',
  mechanic: 'View and complete assigned maintenance tasks',
  auditor: 'View-only access for compliance auditing',
}
