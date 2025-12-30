import { useAppSelector } from '@/app/store'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissions,
  type Permission,
} from '@/lib/rbac'

export function usePermissions() {
  const { user } = useAppSelector((state) => state.auth)
  const role = user?.role

  return {
    role,
    can: (permission: Permission) => hasPermission(role, permission),
    canAny: (permissions: Permission[]) => hasAnyPermission(role, permissions),
    canAll: (permissions: Permission[]) => hasAllPermissions(role, permissions),
    permissions: role ? getPermissions(role) : [],
  }
}
