import type { ApiUserRole } from '@/lib/api'

// JWT payload structure from the backend
interface JwtPayload {
  sub: string // user ID
  org_id: string
  role: ApiUserRole
  typ: 'access' | 'refresh'
  exp: number // expiration timestamp
  iat: number // issued at timestamp
  jti: string // JWT ID
}

/**
 * Decode a JWT token without verifying the signature.
 * This is safe for extracting claims on the client side since
 * the token was already validated by the backend.
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('Invalid JWT format')
      return null
    }

    // Decode the payload (second part)
    const payload = parts[1]
    // Handle base64url encoding (replace - with +, _ with /)
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    // Add padding if necessary
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)

    const decoded = atob(padded)
    return JSON.parse(decoded) as JwtPayload
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

/**
 * Extract user info from a JWT token
 */
export function getUserFromToken(token: string): {
  id: string
  orgId: string
  role: ApiUserRole
} | null {
  const payload = decodeJwt(token)
  if (!payload) return null

  return {
    id: payload.sub,
    orgId: payload.org_id,
    role: payload.role,
  }
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token)
  if (!payload) return true

  // exp is in seconds, Date.now() is in milliseconds
  return payload.exp * 1000 < Date.now()
}
