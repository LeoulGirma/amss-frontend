// WebSocket connection manager for real-time updates

type MessageHandler = (data: unknown) => void
type ConnectionHandler = () => void

interface WebSocketMessage {
  type: string
  payload: unknown
  timestamp: string
}

class WebSocketManager {
  private socket: WebSocket | null = null
  private baseUrl: string
  private orgId: string | null = null
  private userId: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map()
  private connectionHandlers: Set<ConnectionHandler> = new Set()
  private disconnectionHandlers: Set<ConnectionHandler> = new Set()
  private isIntentionallyClosed = false

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setCredentials(orgId: string, userId?: string): void {
    this.orgId = orgId
    this.userId = userId || null
  }

  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return
    }

    // Don't connect without org_id
    if (!this.orgId) {
      console.log('[WebSocket] Skipping connection - no org_id set')
      return
    }

    this.isIntentionallyClosed = false

    try {
      const url = `${this.baseUrl}?org_id=${this.orgId}${this.userId ? `&user_id=${this.userId}` : ''}`
      this.socket = new WebSocket(url)

      this.socket.onopen = () => {
        console.log('[WebSocket] Connected')
        this.reconnectAttempts = 0
        this.connectionHandlers.forEach((handler) => handler())
      }

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error)
        }
      }

      this.socket.onclose = () => {
        console.log('[WebSocket] Disconnected')
        this.disconnectionHandlers.forEach((handler) => handler())

        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect()
        }
      }

      this.socket.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
      }
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error)
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    setTimeout(() => this.connect(), delay)
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type)
    if (handlers) {
      handlers.forEach((handler) => handler(message.payload))
    }

    // Also notify 'all' handlers
    const allHandlers = this.messageHandlers.get('*')
    if (allHandlers) {
      allHandlers.forEach((handler) => handler(message))
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  subscribe(messageType: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set())
    }
    this.messageHandlers.get(messageType)!.add(handler)

    return () => {
      this.messageHandlers.get(messageType)?.delete(handler)
    }
  }

  onConnect(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler)
    return () => this.connectionHandlers.delete(handler)
  }

  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectionHandlers.add(handler)
    return () => this.disconnectionHandlers.delete(handler)
  }

  send(type: string, payload: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload, timestamp: new Date().toISOString() }))
    } else {
      console.warn('[WebSocket] Cannot send message - not connected')
    }
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }
}

// Create singleton instance
const wsUrl = import.meta.env.VITE_WS_URL || 'wss://amss-api-uat.duckdns.org/ws'
export const wsManager = new WebSocketManager(wsUrl)

// Message types
export const WS_EVENTS = {
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  TASK_STATUS_CHANGED: 'task:status_changed',
  NOTIFICATION: 'notification',
  AIRCRAFT_STATUS_CHANGED: 'aircraft:status_changed',
  PART_LOW_STOCK: 'part:low_stock',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
} as const
