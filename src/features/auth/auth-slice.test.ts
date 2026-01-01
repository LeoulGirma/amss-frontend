import { describe, it, expect, beforeEach, vi } from 'vitest'
import authReducer, {
  setCredentials,
  setUser,
  setOrgId,
  logout,
  setLoading,
} from './auth-slice'
import type { ApiUser } from '@/lib/api'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('auth-slice', () => {
  const mockUser: ApiUser = {
    id: 'user-123',
    org_id: 'org-456',
    email: 'test@example.com',
    role: 'admin',
    first_name: 'Test',
    last_name: 'User',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const initialState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    orgId: null,
  }

  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('setCredentials', () => {
    it('should set token and mark as authenticated', () => {
      const state = authReducer(
        initialState,
        setCredentials({ token: 'test-token' })
      )

      expect(state.token).toBe('test-token')
      expect(state.isAuthenticated).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test-token')
    })

    it('should set user when provided', () => {
      const state = authReducer(
        initialState,
        setCredentials({ token: 'test-token', user: mockUser })
      )

      expect(state.user).toEqual(mockUser)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(mockUser)
      )
    })

    it('should set refresh token when provided', () => {
      const state = authReducer(
        initialState,
        setCredentials({ token: 'test-token', refreshToken: 'refresh-token' })
      )

      expect(state.refreshToken).toBe('refresh-token')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token'
      )
    })

    it('should set orgId when provided', () => {
      const state = authReducer(
        initialState,
        setCredentials({ token: 'test-token', orgId: 'org-789' })
      )

      expect(state.orgId).toBe('org-789')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('org_id', 'org-789')
    })
  })

  describe('setUser', () => {
    it('should set user and save to localStorage', () => {
      const state = authReducer(initialState, setUser(mockUser))

      expect(state.user).toEqual(mockUser)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(mockUser)
      )
    })
  })

  describe('setOrgId', () => {
    it('should set orgId and save to localStorage', () => {
      const state = authReducer(initialState, setOrgId('new-org-id'))

      expect(state.orgId).toBe('new-org-id')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('org_id', 'new-org-id')
    })
  })

  describe('logout', () => {
    it('should clear all auth state', () => {
      const authenticatedState = {
        user: mockUser,
        token: 'test-token',
        refreshToken: 'refresh-token',
        isAuthenticated: true,
        isLoading: false,
        orgId: 'org-123',
      }

      const state = authReducer(authenticatedState, logout())

      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.refreshToken).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.orgId).toBeNull()
    })

    it('should remove all items from localStorage', () => {
      const authenticatedState = {
        user: mockUser,
        token: 'test-token',
        refreshToken: 'refresh-token',
        isAuthenticated: true,
        isLoading: false,
        orgId: 'org-123',
      }

      authReducer(authenticatedState, logout())

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('org_id')
    })
  })

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const state = authReducer(initialState, setLoading(true))

      expect(state.isLoading).toBe(true)
    })

    it('should set loading to false', () => {
      const loadingState = { ...initialState, isLoading: true }
      const state = authReducer(loadingState, setLoading(false))

      expect(state.isLoading).toBe(false)
    })
  })
})
