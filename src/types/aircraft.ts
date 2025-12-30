export type AircraftStatus = 'operational' | 'maintenance' | 'grounded'

export interface Aircraft {
  id: string
  tailNumber: string
  type: string
  model: string
  manufacturer: string
  status: AircraftStatus
  flightHours: number
  flightCycles: number
  lastMaintenance: string
  nextMaintenance: string
  location: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface AircraftSummary {
  id: string
  tailNumber: string
  type: string
  status: AircraftStatus
  flightHours: number
  nextMaintenance: string
  location: string
}

export interface FleetStats {
  total: number
  operational: number
  inMaintenance: number
  grounded: number
}
