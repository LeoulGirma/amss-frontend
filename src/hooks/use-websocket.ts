import { useEffect, useState, useCallback } from 'react'
import { wsManager, WS_EVENTS } from '@/lib/websocket'
import { useAppDispatch, useAppSelector } from '@/app/store'
import { addNotification } from '@/features/notifications'
import type { Notification } from '@/types/notification'

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<unknown>(null)
  const dispatch = useAppDispatch()
  const { orgId, user } = useAppSelector((state) => state.auth)

  useEffect(() => {
    // Don't connect for demo mode or if not logged in
    if (!orgId || orgId === 'demo-org') {
      return
    }

    // Set credentials and connect
    wsManager.setCredentials(orgId, user?.id)
    wsManager.connect()

    // Set up connection handlers
    const unsubConnect = wsManager.onConnect(() => {
      setIsConnected(true)
    })

    const unsubDisconnect = wsManager.onDisconnect(() => {
      setIsConnected(false)
    })

    // Listen for all messages
    const unsubMessages = wsManager.subscribe('*', (message) => {
      setLastMessage(message)
    })

    // Listen for notifications
    const unsubNotifications = wsManager.subscribe(WS_EVENTS.NOTIFICATION, (payload) => {
      const notification = payload as Notification
      dispatch(addNotification(notification))
    })

    // Set initial connection state
    setIsConnected(wsManager.isConnected)

    return () => {
      unsubConnect()
      unsubDisconnect()
      unsubMessages()
      unsubNotifications()
      wsManager.disconnect()
    }
  }, [dispatch, orgId, user?.id])

  const send = useCallback((type: string, payload: unknown) => {
    wsManager.send(type, payload)
  }, [])

  const subscribe = useCallback((messageType: string, handler: (data: unknown) => void) => {
    return wsManager.subscribe(messageType, handler)
  }, [])

  return {
    isConnected,
    lastMessage,
    send,
    subscribe,
  }
}

// Hook for subscribing to specific message types
export function useWebSocketEvent<T = unknown>(
  eventType: string,
  handler: (data: T) => void
) {
  useEffect(() => {
    const unsubscribe = wsManager.subscribe(eventType, handler as (data: unknown) => void)
    return unsubscribe
  }, [eventType, handler])
}
