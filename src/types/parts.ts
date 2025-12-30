export type PartCondition = 'new' | 'serviceable' | 'repairable' | 'scrap'

export interface Part {
  id: string
  partNumber: string
  name: string
  description: string
  manufacturer: string
  category: string
  condition: PartCondition
  quantity: number
  minimumStock: number
  unitPrice: number
  location: string
  serialNumbers: string[]
  expirationDate?: string
  certificateNumber?: string
  createdAt: string
  updatedAt: string
}

export interface PartReservation {
  id: string
  partId: string
  partNumber: string
  taskId: string
  quantity: number
  reservedBy: string
  reservedAt: string
  status: 'pending' | 'confirmed' | 'used' | 'cancelled'
}

export interface InventoryStats {
  totalParts: number
  lowStock: number
  expiringSoon: number
  reservedParts: number
}
