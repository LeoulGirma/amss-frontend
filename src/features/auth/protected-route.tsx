import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAppSelector, useAppDispatch } from '@/app/store'
import { setInitialized, logout } from './auth-slice'
import { useGetMeQuery } from '@/lib/api'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const dispatch = useAppDispatch()
  const { isAuthenticated, isInitialized, token } = useAppSelector((state) => state.auth)
  const location = useLocation()

  // Validate token by fetching current user
  const { isLoading, isError } = useGetMeQuery(undefined, {
    skip: !token || isInitialized,
  })

  useEffect(() => {
    if (!token) {
      // No token, already initialized
      return
    }

    if (isError) {
      // Token is invalid, log out and redirect
      dispatch(logout())
    } else if (!isLoading && !isError) {
      // Token is valid, mark as initialized
      dispatch(setInitialized(true))
    }
  }, [isLoading, isError, token, dispatch])

  // Show loading screen while validating token
  if (token && !isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login, but save the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
