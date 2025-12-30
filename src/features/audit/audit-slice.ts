import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuditLogEntry } from '@/types/audit'

// Generate mock audit data
const generateMockAuditLogs = (): AuditLogEntry[] => {
  const users = [
    { id: '1', name: 'Mike Johnson', email: 'mike@example.com' },
    { id: '2', name: 'Sarah Chen', email: 'sarah@example.com' },
    { id: '3', name: 'John Smith', email: 'john@example.com' },
    { id: '4', name: 'Tom Wilson', email: 'tom@example.com' },
    { id: '5', name: 'System', email: 'system@amss.local' },
  ]

  const entries: AuditLogEntry[] = [
    {
      id: '1',
      action: 'status_change',
      resource: 'task',
      resourceId: 'T-001',
      resourceName: 'C-Check Inspection',
      userId: users[0].id,
      userName: users[0].name,
      userEmail: users[0].email,
      changes: [
        { field: 'status', oldValue: 'scheduled', newValue: 'in_progress' },
      ],
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      action: 'update',
      resource: 'part',
      resourceId: 'P-7890',
      resourceName: 'Brake Assembly',
      userId: users[1].id,
      userName: users[1].name,
      userEmail: users[1].email,
      changes: [
        { field: 'quantity', oldValue: 10, newValue: 8 },
        { field: 'status', oldValue: 'available', newValue: 'reserved' },
      ],
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      action: 'create',
      resource: 'task',
      resourceId: 'T-015',
      resourceName: 'APU Replacement',
      userId: users[2].id,
      userName: users[2].name,
      userEmail: users[2].email,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      action: 'assign',
      resource: 'task',
      resourceId: 'T-010',
      resourceName: 'Engine Borescope',
      userId: users[0].id,
      userName: users[0].name,
      userEmail: users[0].email,
      changes: [
        { field: 'assignedTo', oldValue: [], newValue: ['Tom Wilson'] },
      ],
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '5',
      action: 'approve',
      resource: 'compliance',
      resourceId: 'AD-2024-15-06',
      resourceName: 'Airworthiness Directive Compliance',
      userId: users[2].id,
      userName: users[2].name,
      userEmail: users[2].email,
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '6',
      action: 'status_change',
      resource: 'aircraft',
      resourceId: 'N98765',
      resourceName: 'Boeing 737-800',
      userId: users[4].id,
      userName: users[4].name,
      userEmail: users[4].email,
      changes: [
        { field: 'status', oldValue: 'operational', newValue: 'grounded' },
      ],
      metadata: { reason: 'AOG - Hydraulic system failure' },
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '7',
      action: 'login',
      resource: 'user',
      resourceId: users[0].id,
      resourceName: users[0].name,
      userId: users[0].id,
      userName: users[0].name,
      userEmail: users[0].email,
      ipAddress: '192.168.1.100',
      timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '8',
      action: 'export',
      resource: 'report',
      resourceId: 'RPT-001',
      resourceName: 'Fleet Status Report',
      userId: users[1].id,
      userName: users[1].name,
      userEmail: users[1].email,
      metadata: { format: 'PDF', size: '2.4 MB' },
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '9',
      action: 'delete',
      resource: 'notification',
      resourceId: 'N-055',
      resourceName: 'Old maintenance reminder',
      userId: users[3].id,
      userName: users[3].name,
      userEmail: users[3].email,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '10',
      action: 'update',
      resource: 'settings',
      resourceId: 'ORG-001',
      resourceName: 'Organization Settings',
      userId: users[0].id,
      userName: users[0].name,
      userEmail: users[0].email,
      changes: [
        { field: 'maintenanceAlertDays', oldValue: 7, newValue: 14 },
      ],
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  return entries
}

interface AuditState {
  entries: AuditLogEntry[]
  isLoading: boolean
}

const initialState: AuditState = {
  entries: generateMockAuditLogs(),
  isLoading: false,
}

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    addEntry: (state, action: PayloadAction<AuditLogEntry>) => {
      state.entries.unshift(action.payload)
    },
    setEntries: (state, action: PayloadAction<AuditLogEntry[]>) => {
      state.entries = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
  },
})

export const { addEntry, setEntries, setLoading } = auditSlice.actions
export default auditSlice.reducer
