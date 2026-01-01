import { describe, it, expect } from 'vitest'
import {
  transformAuditLog,
  transformAuditLogs,
  getActionLabel,
  getResourceLabel,
} from './audit-transform'
import type { ApiAuditLog, ApiUser } from './api'

describe('audit-transform', () => {
  const mockUser: ApiUser = {
    id: 'user-123',
    org_id: 'org-456',
    email: 'john.doe@example.com',
    role: 'admin',
    first_name: 'John',
    last_name: 'Doe',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockApiLog: ApiAuditLog = {
    id: 'audit-1',
    org_id: 'org-456',
    entity_type: 'aircraft',
    entity_id: 'aircraft-789',
    action: 'update',
    user_id: 'user-123',
    request_id: 'req-111',
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    entity_version: 1,
    timestamp: '2024-01-15T10:30:00Z',
    details: {
      resource_name: 'N12345',
      changes: [
        { field: 'status', old_value: 'active', new_value: 'maintenance' },
      ],
    },
  }

  describe('transformAuditLog', () => {
    it('should transform an API audit log to frontend format', () => {
      const usersMap = new Map<string, ApiUser>()
      usersMap.set('user-123', mockUser)

      const result = transformAuditLog(mockApiLog, usersMap)

      expect(result).toEqual({
        id: 'audit-1',
        action: 'update',
        resource: 'aircraft',
        resourceId: 'aircraft-789',
        resourceName: 'N12345',
        userId: 'user-123',
        userName: 'john.doe',
        userEmail: 'john.doe@example.com',
        changes: [
          { field: 'status', oldValue: 'active', newValue: 'maintenance' },
        ],
        metadata: undefined,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: '2024-01-15T10:30:00Z',
      })
    })

    it('should handle unknown user', () => {
      const usersMap = new Map<string, ApiUser>()

      const result = transformAuditLog(mockApiLog, usersMap)

      expect(result.userName).toBe('Unknown User')
      expect(result.userEmail).toBe('unknown@example.com')
    })

    it('should use entity_id as resourceName when resource_name is missing', () => {
      const usersMap = new Map<string, ApiUser>()
      const logWithoutName: ApiAuditLog = {
        ...mockApiLog,
        details: { changes: [] },
      }

      const result = transformAuditLog(logWithoutName, usersMap)

      expect(result.resourceName).toBe('aircraft-789')
    })

    it('should handle state_change action', () => {
      const usersMap = new Map<string, ApiUser>()
      const stateChangeLog: ApiAuditLog = {
        ...mockApiLog,
        action: 'state_change',
      }

      const result = transformAuditLog(stateChangeLog, usersMap)

      expect(result.action).toBe('state_change')
    })

    it('should default to update for unknown actions', () => {
      const usersMap = new Map<string, ApiUser>()
      const unknownActionLog: ApiAuditLog = {
        ...mockApiLog,
        action: 'some_unknown_action',
      }

      const result = transformAuditLog(unknownActionLog, usersMap)

      expect(result.action).toBe('update')
    })

    it('should default to task for unknown resource types', () => {
      const usersMap = new Map<string, ApiUser>()
      const unknownResourceLog: ApiAuditLog = {
        ...mockApiLog,
        entity_type: 'unknown_type',
      }

      const result = transformAuditLog(unknownResourceLog, usersMap)

      expect(result.resource).toBe('task')
    })

    it('should include metadata when present', () => {
      const usersMap = new Map<string, ApiUser>()
      const logWithMetadata: ApiAuditLog = {
        ...mockApiLog,
        details: {
          resource_name: 'N12345',
          changes: [],
          action_type: 'scheduled_maintenance',
          priority: 'high',
        },
      }

      const result = transformAuditLog(logWithMetadata, usersMap)

      expect(result.metadata).toEqual({
        action_type: 'scheduled_maintenance',
        priority: 'high',
      })
    })

    it('should not include empty changes array', () => {
      const usersMap = new Map<string, ApiUser>()
      const logWithEmptyChanges: ApiAuditLog = {
        ...mockApiLog,
        details: {
          resource_name: 'N12345',
          changes: [],
        },
      }

      const result = transformAuditLog(logWithEmptyChanges, usersMap)

      expect(result.changes).toBeUndefined()
    })
  })

  describe('transformAuditLogs', () => {
    it('should transform an array of audit logs', () => {
      const logs: ApiAuditLog[] = [
        mockApiLog,
        { ...mockApiLog, id: 'audit-2', action: 'create' },
      ]
      const users: ApiUser[] = [mockUser]

      const result = transformAuditLogs(logs, users)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('audit-1')
      expect(result[1].id).toBe('audit-2')
      expect(result[0].userName).toBe('john.doe')
      expect(result[1].userName).toBe('john.doe')
    })

    it('should handle empty arrays', () => {
      const result = transformAuditLogs([], [])

      expect(result).toEqual([])
    })
  })

  describe('getActionLabel', () => {
    it('should return correct labels for all actions', () => {
      expect(getActionLabel('create')).toBe('Created')
      expect(getActionLabel('update')).toBe('Updated')
      expect(getActionLabel('delete')).toBe('Deleted')
      expect(getActionLabel('login')).toBe('Logged In')
      expect(getActionLabel('logout')).toBe('Logged Out')
      expect(getActionLabel('status_change')).toBe('Status Changed')
      expect(getActionLabel('state_change')).toBe('State Changed')
      expect(getActionLabel('assign')).toBe('Assigned')
      expect(getActionLabel('unassign')).toBe('Unassigned')
      expect(getActionLabel('approve')).toBe('Approved')
      expect(getActionLabel('reject')).toBe('Rejected')
      expect(getActionLabel('export')).toBe('Exported')
      expect(getActionLabel('import')).toBe('Imported')
    })
  })

  describe('getResourceLabel', () => {
    it('should return correct labels for all resources', () => {
      expect(getResourceLabel('aircraft')).toBe('Aircraft')
      expect(getResourceLabel('task')).toBe('Task')
      expect(getResourceLabel('part')).toBe('Part')
      expect(getResourceLabel('user')).toBe('User')
      expect(getResourceLabel('team')).toBe('Team')
      expect(getResourceLabel('compliance')).toBe('Compliance')
      expect(getResourceLabel('report')).toBe('Report')
      expect(getResourceLabel('settings')).toBe('Settings')
      expect(getResourceLabel('notification')).toBe('Notification')
    })
  })
})
