import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Notification } from '@/types/notification'

// Mock notifications for demo
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'maintenance_due',
    title: 'C-Check Due Soon',
    message: 'N12345 - C-Check due in 48 hours. Ensure hangar availability.',
    priority: 'high',
    read: false,
    link: '/maintenance',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'part_low_stock',
    title: 'Low Stock Alert',
    message: 'Brake Assembly PN-7890 stock below minimum (2 remaining).',
    priority: 'medium',
    read: false,
    link: '/parts',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'task_completed',
    title: 'Task Completed',
    message: 'N67890 - Engine inspection signed off by Mike Johnson.',
    priority: 'low',
    read: false,
    link: '/maintenance',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'compliance_expiring',
    title: 'Certification Expiring',
    message: 'AD 2024-15-06 compliance due in 7 days for N11111.',
    priority: 'high',
    read: true,
    link: '/compliance',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: 'You have been assigned to APU Replacement on N22222.',
    priority: 'medium',
    read: true,
    link: '/kanban',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload)
      if (!action.payload.read) {
        state.unreadCount += 1
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload)
      if (notification && !notification.read) {
        notification.read = true
        state.unreadCount -= 1
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((n) => {
        n.read = true
      })
      state.unreadCount = 0
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex((n) => n.id === action.payload)
      if (index !== -1) {
        if (!state.notifications[index].read) {
          state.unreadCount -= 1
        }
        state.notifications.splice(index, 1)
      }
    },
    clearAll: (state) => {
      state.notifications = []
      state.unreadCount = 0
    },
    loadDemoNotifications: (state) => {
      state.notifications = mockNotifications
      state.unreadCount = mockNotifications.filter((n) => !n.read).length
    },
  },
})

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAll,
  loadDemoNotifications,
} = notificationsSlice.actions

export default notificationsSlice.reducer
