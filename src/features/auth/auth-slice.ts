import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ApiUser } from '@/lib/api'

interface AuthState {
  user: ApiUser | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  orgId: string | null
}

// Initialize from localStorage
const storedToken = localStorage.getItem('token')
const storedRefreshToken = localStorage.getItem('refresh_token')
const storedUser = localStorage.getItem('user')
const storedOrgId = localStorage.getItem('org_id')

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
  refreshToken: storedRefreshToken,
  isAuthenticated: !!storedToken,
  isLoading: false,
  orgId: storedOrgId,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user?: ApiUser | null
        token: string
        refreshToken?: string
        orgId?: string
      }>
    ) => {
      if (action.payload.user !== undefined) {
        state.user = action.payload.user
        if (action.payload.user) {
          localStorage.setItem('user', JSON.stringify(action.payload.user))
        }
      }
      state.token = action.payload.token
      state.isAuthenticated = true
      localStorage.setItem('token', action.payload.token)

      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken
        localStorage.setItem('refresh_token', action.payload.refreshToken)
      }

      if (action.payload.orgId) {
        state.orgId = action.payload.orgId
        localStorage.setItem('org_id', action.payload.orgId)
      }
    },
    setUser: (state, action: PayloadAction<ApiUser>) => {
      state.user = action.payload
      localStorage.setItem('user', JSON.stringify(action.payload))
    },
    setOrgId: (state, action: PayloadAction<string>) => {
      state.orgId = action.payload
      localStorage.setItem('org_id', action.payload)
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.orgId = null
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('org_id')
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
  },
})

export const { setCredentials, setUser, setOrgId, logout, setLoading } = authSlice.actions
export default authSlice.reducer
