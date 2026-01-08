import { useEffect, useCallback } from 'react'
import { wsManager, WS_EVENTS } from '@/lib/websocket'
import { useAppDispatch, useAppSelector } from '@/app/store'
import { api } from '@/lib/api'
import { addNotification } from '@/features/notifications'
import { toast } from 'sonner'

interface WebSocketPayload {
  entity_type?: string
  entity_id?: string
  action?: string
  type?: string
  title?: string
  message?: string
  [key: string]: unknown
}

/**
 * Hook that syncs WebSocket events with RTK Query cache
 * Automatically invalidates relevant cache tags when data changes
 */
export function useRealtimeSync() {
  const dispatch = useAppDispatch()
  const { orgId, user, isAuthenticated } = useAppSelector((state) => state.auth)

  const handleTaskEvent = useCallback((data: unknown) => {
    const payload = data as WebSocketPayload
    // Invalidate task-related cache
    dispatch(api.util.invalidateTags(['Task', 'Report']))

    // Show toast notification for task updates
    const action = payload.action || 'updated'
    toast.info(`Task ${action}`, {
      description: 'Data has been refreshed',
      duration: 2000,
    })
  }, [dispatch])

  const handleAircraftEvent = useCallback((_data: unknown) => {
    // Invalidate aircraft-related cache
    dispatch(api.util.invalidateTags(['Aircraft', 'Report']))

    toast.info('Aircraft status changed', {
      description: 'Fleet data has been refreshed',
      duration: 2000,
    })
  }, [dispatch])

  const handleNotificationEvent = useCallback((data: unknown) => {
    const payload = data as WebSocketPayload
    // Add notification to store
    dispatch(addNotification({
      id: String(Date.now()),
      type: (payload.type as 'system' | 'task_assigned' | 'maintenance_due') || 'system',
      title: String(payload.title || 'Notification'),
      message: String(payload.message || ''),
      priority: 'medium',
      createdAt: new Date().toISOString(),
      read: false,
    }))
  }, [dispatch])

  const handlePartEvent = useCallback((_data: unknown) => {
    // Invalidate parts-related cache
    dispatch(api.util.invalidateTags(['Part', 'PartItem', 'Report']))
  }, [dispatch])

  const handleGenericEvent = useCallback((data: unknown) => {
    const payload = data as WebSocketPayload
    // Handle any other events by invalidating based on entity type
    const entityType = payload.entity_type
    if (entityType) {
      const tagMap: Record<string, string[]> = {
        'aircraft': ['Aircraft', 'Report'],
        'maintenance_task': ['Task', 'Report'],
        'task': ['Task', 'Report'],
        'part_item': ['PartItem', 'Part', 'Report'],
        'part_definition': ['Part'],
        'user': ['User'],
        'compliance_item': ['Compliance', 'Report'],
        'audit_log': ['AuditLog'],
      }
      const tags = tagMap[entityType]
      if (tags) {
        dispatch(api.util.invalidateTags(tags as Parameters<typeof api.util.invalidateTags>[0]))
      }
    }
  }, [dispatch])

  useEffect(() => {
    // Don't connect for demo mode or if not logged in
    if (!isAuthenticated || !orgId) {
      return
    }

    // Set credentials and connect
    wsManager.setCredentials(orgId, user?.id)
    wsManager.connect()

    // Subscribe to specific events
    const unsubTaskCreated = wsManager.subscribe(WS_EVENTS.TASK_CREATED, handleTaskEvent)
    const unsubTaskUpdated = wsManager.subscribe(WS_EVENTS.TASK_UPDATED, handleTaskEvent)
    const unsubTaskDeleted = wsManager.subscribe(WS_EVENTS.TASK_DELETED, handleTaskEvent)
    const unsubTaskStatus = wsManager.subscribe(WS_EVENTS.TASK_STATUS_CHANGED, handleTaskEvent)
    const unsubAircraftStatus = wsManager.subscribe(WS_EVENTS.AIRCRAFT_STATUS_CHANGED, handleAircraftEvent)
    const unsubNotification = wsManager.subscribe(WS_EVENTS.NOTIFICATION, handleNotificationEvent)
    const unsubPartLowStock = wsManager.subscribe(WS_EVENTS.PART_LOW_STOCK, handlePartEvent)

    // Subscribe to all events for generic handling
    const unsubAll = wsManager.subscribe('*', (message: unknown) => {
      const msg = message as { type: string; payload: WebSocketPayload }
      // Only handle events not covered by specific handlers
      if (!Object.values(WS_EVENTS).includes(msg.type as any)) {
        handleGenericEvent(msg.payload)
      }
    })

    return () => {
      unsubTaskCreated()
      unsubTaskUpdated()
      unsubTaskDeleted()
      unsubTaskStatus()
      unsubAircraftStatus()
      unsubNotification()
      unsubPartLowStock()
      unsubAll()
      wsManager.disconnect()
    }
  }, [
    isAuthenticated,
    orgId,
    user?.id,
    handleTaskEvent,
    handleAircraftEvent,
    handleNotificationEvent,
    handlePartEvent,
    handleGenericEvent,
  ])

  return {
    isConnected: wsManager.isConnected,
  }
}
