export * from './aircraft'
export * from './maintenance'
export * from './user'
export * from './parts'
export * from './compliance'
export * from './notification'
export * from './audit'
export * from './attachment'

// Common types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  code: string
  details?: Record<string, string[]>
}
