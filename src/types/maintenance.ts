export type TaskStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type MaintenanceType = 'a_check' | 'b_check' | 'c_check' | 'd_check' | 'line' | 'component' | 'engine'

export interface MaintenanceTask {
  id: string
  title: string
  description: string
  aircraftId: string
  tailNumber: string
  aircraftType: string
  type: MaintenanceType
  status: TaskStatus
  priority: TaskPriority
  scheduledStart: string
  scheduledEnd: string
  actualStart?: string
  actualEnd?: string
  assignedTo: string[]
  estimatedHours: number
  actualHours?: number
  location: string
  partsRequired: string[]
  complianceItems: string[]
  notes: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface MaintenanceProgram {
  id: string
  name: string
  description: string
  type: MaintenanceType
  intervalFlightHours?: number
  intervalFlightCycles?: number
  intervalDays?: number
  estimatedDuration: number
  requiredCertifications: string[]
  tasks: string[]
  isActive: boolean
}

export interface TaskStats {
  pending: number
  inProgress: number
  completed: number
  overdue: number
}
