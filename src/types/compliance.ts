export type ComplianceStatus = 'compliant' | 'pending' | 'overdue' | 'not_applicable'

export type ComplianceCategory = 'ad' | 'sb' | 'inspection' | 'certification' | 'training'

export interface ComplianceItem {
  id: string
  title: string
  description: string
  category: ComplianceCategory
  status: ComplianceStatus
  aircraftId?: string
  tailNumber?: string
  dueDate: string
  completedDate?: string
  regulatoryReference: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignedTo?: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface ComplianceStats {
  total: number
  pending: number
  compliant: number
  overdue: number
}
