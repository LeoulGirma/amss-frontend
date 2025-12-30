import type { ReactNode } from 'react'
import { usePermissions } from '@/hooks'
import type { Permission } from '@/lib/rbac'

interface PermissionGateProps {
  children: ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: ReactNode
}

export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGateProps) {
  const { can, canAny, canAll } = usePermissions()

  let hasAccess = false

  if (permission) {
    hasAccess = can(permission)
  } else if (permissions) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions)
  } else {
    hasAccess = true
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// HOC version for wrapping components
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission
) {
  return function WrappedComponent(props: P) {
    return (
      <PermissionGate permission={permission}>
        <Component {...props} />
      </PermissionGate>
    )
  }
}
