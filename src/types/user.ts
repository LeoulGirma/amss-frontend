import type { ApiUserRole } from '@/lib/api'

// Re-export API role for convenience
export type UserRole = ApiUserRole

// Extended user interface for frontend display
export interface User {
  id: string
  email: string
  org_id: string
  role: UserRole
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface Certification {
  id: string
  name: string
  number: string
  issuedBy: string
  issuedDate: string
  expirationDate: string
  type: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: UserRole
  certifications: string[]
  assignedTasks: number
  completedTasks: number
  availability: 'available' | 'busy' | 'off'
}
