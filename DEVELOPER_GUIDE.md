# AMSS Frontend Developer Guide

A comprehensive guide for developers working on the Aircraft Maintenance Scheduling System (AMSS) frontend.

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Getting Started](#getting-started)
4. [Architecture Overview](#architecture-overview)
5. [State Management](#state-management)
6. [API Integration (RTK Query)](#api-integration-rtk-query)
7. [Authentication System](#authentication-system)
8. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
9. [Component Patterns](#component-patterns)
10. [Adding New Features](#adding-new-features)
11. [Styling Guide](#styling-guide)
12. [Testing Permissions](#testing-permissions)

---

## Technology Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | React | 19.x | UI library |
| **Build Tool** | Vite | 7.x | Development server & bundler |
| **Language** | TypeScript | 5.9.x | Type safety |
| **Routing** | React Router | 7.x | Client-side routing |
| **State Management** | Redux Toolkit | 2.x | Global state & API caching |
| **API Layer** | RTK Query | (bundled) | Data fetching & caching |
| **Forms** | React Hook Form + Zod | 7.x / 4.x | Form handling & validation |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |
| **UI Components** | shadcn/ui + Radix | - | Accessible component primitives |
| **Icons** | Lucide React | 0.5x | Icon library |
| **Charts** | Recharts | 3.x | Data visualization |
| **Drag & Drop** | dnd-kit | 6.x | Kanban board interactions |
| **Notifications** | Sonner | 2.x | Toast notifications |
| **Date Handling** | date-fns | 4.x | Date formatting/manipulation |

---

## Project Structure

```
src/
├── app/                    # Application setup
│   ├── App.tsx            # Root component
│   ├── router.tsx         # Route definitions
│   ├── store.ts           # Redux store configuration
│   ├── providers.tsx      # Context providers wrapper
│   └── index.ts           # Exports
│
├── features/              # Feature modules (domain-driven)
│   ├── auth/              # Authentication feature
│   │   ├── auth-slice.ts  # Redux slice for auth state
│   │   ├── login-page.tsx # Login UI
│   │   ├── protected-route.tsx
│   │   └── index.ts       # Public exports
│   │
│   ├── fleet/             # Fleet management
│   │   ├── fleet-page.tsx
│   │   ├── aircraft-form.tsx
│   │   └── index.ts
│   │
│   ├── maintenance/       # Maintenance tasks
│   │   ├── maintenance-page.tsx
│   │   ├── task-form.tsx
│   │   ├── calendar-page.tsx
│   │   ├── kanban-board.tsx
│   │   └── index.ts
│   │
│   ├── team/              # Team management
│   ├── parts/             # Parts inventory
│   ├── compliance/        # Compliance tracking
│   ├── reports/           # Reporting
│   ├── audit/             # Audit logs
│   ├── settings/          # Application settings
│   ├── dashboard/         # Dashboard/home
│   └── notifications/     # Real-time notifications
│
├── components/            # Shared components
│   ├── ui/               # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ...
│   │
│   ├── layout/           # Layout components
│   │   ├── main-layout.tsx
│   │   ├── sidebar.tsx
│   │   └── header.tsx
│   │
│   ├── permission-gate.tsx  # RBAC component
│   ├── aircraft-status-badge.tsx
│   └── ...
│
├── hooks/                 # Custom React hooks
│   ├── use-permissions.ts # RBAC hook
│   └── index.ts
│
├── lib/                   # Utilities & configuration
│   ├── api.ts            # RTK Query API definition
│   ├── rbac.ts           # Role-based access control
│   └── utils.ts          # Helper functions (cn, etc.)
│
├── types/                 # TypeScript type definitions
│   └── index.ts
│
├── styles/               # Global styles
│   └── globals.css
│
└── main.tsx              # Entry point
```

### Key Principles

1. **Feature-based organization**: Each domain feature has its own folder with all related files
2. **Index exports**: Each folder has an `index.ts` that exports public APIs
3. **Colocation**: Keep related files together (page + form + slice)
4. **Separation of concerns**: UI components separate from business logic

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd amss-frontend
npm install
```

### Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

For production:
```env
VITE_API_BASE_URL=https://your-api-domain.com/api/v1
```

### Development

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Components                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  FleetPage  │  │  TeamPage   │  │  MaintenancePage        │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                      │                │
│         ▼                ▼                      ▼                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              RTK Query Hooks (useGet*Query)              │    │
│  │  • Automatic caching    • Background refetch             │    │
│  │  • Loading states       • Error handling                 │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │                    Redux Store                           │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │    │
│  │  │  api slice  │  │ auth slice  │  │ notifications   │  │    │
│  │  │  (RTK Q)    │  │ (user/tok)  │  │ slice           │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Backend API   │
                    │  /api/v1/*      │
                    └─────────────────┘
```

### Request Flow with Auth

```
1. Component calls useGetAircraftListQuery()
2. RTK Query checks cache → if valid, return cached data
3. If cache miss/stale → make HTTP request
4. baseQueryWithReauth adds Authorization header from Redux state
5. If 401 response → automatically refresh token
6. If refresh fails → logout user
7. Response cached with tags for invalidation
```

---

## State Management

### Redux Store Structure

```typescript
// src/app/store.ts
{
  api: {
    // RTK Query manages this automatically
    queries: { /* cached API responses */ },
    mutations: { /* mutation states */ },
  },
  auth: {
    user: ApiUser | null,      // Current user profile
    token: string | null,       // JWT access token
    refreshToken: string | null,
    isAuthenticated: boolean,
    orgId: string | null,       // Current organization
  },
  notifications: {
    items: Notification[],
    unreadCount: number,
  },
  audit: {
    filters: AuditFilters,
  }
}
```

### Using Redux State

```typescript
// Reading state with typed selector
import { useAppSelector } from '@/app/store'

function MyComponent() {
  const { user, orgId } = useAppSelector((state) => state.auth)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
}

// Dispatching actions
import { useAppDispatch } from '@/app/store'
import { logout } from '@/features/auth'

function LogoutButton() {
  const dispatch = useAppDispatch()

  const handleLogout = () => {
    dispatch(logout())
  }
}
```

### Creating a New Slice

```typescript
// src/features/myfeature/myfeature-slice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface MyFeatureState {
  items: Item[]
  selectedId: string | null
}

const initialState: MyFeatureState = {
  items: [],
  selectedId: null,
}

const myFeatureSlice = createSlice({
  name: 'myFeature',
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<Item[]>) => {
      state.items = action.payload
    },
    selectItem: (state, action: PayloadAction<string>) => {
      state.selectedId = action.payload
    },
    clearSelection: (state) => {
      state.selectedId = null
    },
  },
})

export const { setItems, selectItem, clearSelection } = myFeatureSlice.actions
export default myFeatureSlice.reducer
```

Then add to store:

```typescript
// src/app/store.ts
import myFeatureReducer from '@/features/myfeature/myfeature-slice'

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    myFeature: myFeatureReducer,  // Add here
  },
  // ...
})
```

---

## API Integration (RTK Query)

### Overview

All API calls go through RTK Query defined in `src/lib/api.ts`. This provides:

- **Automatic caching** with configurable TTL
- **Cache invalidation** via tags
- **Loading/error states** built-in
- **Token refresh** handled automatically
- **TypeScript types** for all requests/responses

### Using Query Hooks

```typescript
import {
  useGetAircraftListQuery,
  useCreateAircraftMutation,
} from '@/lib/api'

function FleetPage() {
  // Query hook - fetches data
  const {
    data: aircraft,      // The response data
    isLoading,           // First load
    isFetching,          // Any fetch (including refetch)
    isError,             // Request failed
    error,               // Error details
    refetch,             // Manual refetch function
  } = useGetAircraftListQuery({ status: 'operational' })

  // Mutation hook - modifies data
  const [createAircraft, { isLoading: isCreating }] = useCreateAircraftMutation()

  const handleCreate = async (data: AircraftCreateRequest) => {
    try {
      const result = await createAircraft(data).unwrap()
      toast.success('Aircraft created!')
    } catch (error) {
      toast.error('Failed to create aircraft')
    }
  }
}
```

### Adding New API Endpoints

```typescript
// In src/lib/api.ts

// 1. Define types
export interface MyEntityRequest {
  name: string
  value: number
}

export interface MyEntity {
  id: string
  name: string
  value: number
  created_at: string
}

// 2. Add to tagTypes (for cache invalidation)
tagTypes: ['Aircraft', 'Task', 'MyEntity', ...],

// 3. Add endpoints in the endpoints builder
endpoints: (builder) => ({
  // ... existing endpoints ...

  // GET /my-entities
  getMyEntities: builder.query<MyEntity[], { filter?: string }>({
    query: (params) => ({
      url: '/my-entities',
      params,
    }),
    providesTags: ['MyEntity'],
  }),

  // GET /my-entities/:id
  getMyEntity: builder.query<MyEntity, string>({
    query: (id) => `/my-entities/${id}`,
    providesTags: (_result, _error, id) => [{ type: 'MyEntity', id }],
  }),

  // POST /my-entities
  createMyEntity: builder.mutation<MyEntity, MyEntityRequest>({
    query: (body) => ({
      url: '/my-entities',
      method: 'POST',
      body,
    }),
    invalidatesTags: ['MyEntity'],  // Refetch list after create
  }),

  // PATCH /my-entities/:id
  updateMyEntity: builder.mutation<MyEntity, { id: string; data: Partial<MyEntityRequest> }>({
    query: ({ id, data }) => ({
      url: `/my-entities/${id}`,
      method: 'PATCH',
      body: data,
    }),
    invalidatesTags: (_r, _e, { id }) => [
      { type: 'MyEntity', id },
      'MyEntity',
    ],
  }),

  // DELETE /my-entities/:id
  deleteMyEntity: builder.mutation<void, string>({
    query: (id) => ({
      url: `/my-entities/${id}`,
      method: 'DELETE',
    }),
    invalidatesTags: ['MyEntity'],
  }),
}),

// 4. Export hooks (auto-generated names)
export const {
  useGetMyEntitiesQuery,
  useGetMyEntityQuery,
  useCreateMyEntityMutation,
  useUpdateMyEntityMutation,
  useDeleteMyEntityMutation,
} = api
```

### Cache Tags & Invalidation

```typescript
// Tags tell RTK Query what data to refetch after mutations

// Query provides tags (marks data as this type)
getAircraftList: builder.query({
  query: () => '/aircraft',
  providesTags: ['Aircraft'],  // This data is "Aircraft" type
})

// Mutation invalidates tags (triggers refetch)
createAircraft: builder.mutation({
  query: (body) => ({ url: '/aircraft', method: 'POST', body }),
  invalidatesTags: ['Aircraft'],  // Refetch all Aircraft queries
})

// Fine-grained invalidation
updateAircraft: builder.mutation({
  query: ({ id, data }) => ({
    url: `/aircraft/${id}`,
    method: 'PATCH',
    body: data
  }),
  invalidatesTags: (_result, _error, { id }) => [
    { type: 'Aircraft', id },  // Invalidate specific item
    'Aircraft',                 // Also invalidate list
    'Report',                   // Related data too
  ],
})
```

---

## Authentication System

### Login Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Email     │────▶│   Lookup    │────▶│  Password   │────▶│  Dashboard  │
│   Input     │     │   Orgs      │     │   Login     │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                          │                    │
                          ▼                    ▼
                    POST /auth/lookup    POST /auth/login
                    Returns: orgs[]      Returns: tokens
                                               │
                                               ▼
                                         GET /auth/me
                                         Returns: user profile
```

### Auth State Management

```typescript
// src/features/auth/auth-slice.ts

interface AuthState {
  user: ApiUser | null      // User profile with role
  token: string | null      // JWT access token
  refreshToken: string | null
  isAuthenticated: boolean
  orgId: string | null
}

// Actions
setCredentials({ token, refreshToken, orgId })  // After login
setUser(user)                                    // After /auth/me
logout()                                         // Clear all auth state
```

### Protected Routes

```typescript
// src/features/auth/protected-route.tsx
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Usage in router.tsx
{
  path: '/',
  element: (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  ),
  children: [/* routes */]
}
```

### Token Refresh

Automatic token refresh is handled in `baseQueryWithReauth`:

```typescript
// If API returns 401:
// 1. Try to refresh token via POST /auth/refresh
// 2. If successful, retry original request with new token
// 3. If refresh fails, dispatch logout()
```

---

## Role-Based Access Control (RBAC)

### Roles & Permissions

```typescript
// src/lib/rbac.ts

type UserRole = 'admin' | 'tenant_admin' | 'scheduler' | 'mechanic' | 'auditor'

type Permission =
  | 'view:dashboard'
  | 'view:fleet' | 'manage:fleet'
  | 'view:maintenance' | 'manage:maintenance'
  | 'assign:tasks' | 'complete:tasks'
  | 'view:parts' | 'manage:parts' | 'order:parts'
  | 'view:team' | 'manage:team'
  | 'view:compliance' | 'manage:compliance'
  | 'view:reports' | 'export:reports'
  | 'view:settings' | 'manage:settings'
  | 'manage:organization'
```

### Permission Matrix

| Permission | Admin | Tenant Admin | Scheduler | Mechanic | Auditor |
|------------|:-----:|:------------:|:---------:|:--------:|:-------:|
| view:dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| view:fleet | ✅ | ✅ | ✅ | ✅ | ✅ |
| manage:fleet | ✅ | ✅ | ❌ | ❌ | ❌ |
| view:maintenance | ✅ | ✅ | ✅ | ✅ | ✅ |
| manage:maintenance | ✅ | ✅ | ✅ | ❌ | ❌ |
| assign:tasks | ✅ | ✅ | ✅ | ❌ | ❌ |
| complete:tasks | ✅ | ✅ | ✅ | ✅ | ❌ |
| view:parts | ✅ | ✅ | ✅ | ✅ | ✅ |
| manage:parts | ✅ | ✅ | ❌ | ❌ | ❌ |
| view:team | ✅ | ✅ | ✅ | ✅ | ✅ |
| manage:team | ✅ | ✅ | ❌ | ❌ | ❌ |
| view:reports | ✅ | ✅ | ✅ | ❌ | ✅ |
| manage:organization | ✅ | ❌ | ❌ | ❌ | ❌ |

### Using Permissions in Components

#### Method 1: PermissionGate Component

```tsx
import { PermissionGate } from '@/components/permission-gate'

function FleetPage() {
  return (
    <div>
      <h1>Fleet</h1>

      {/* Single permission */}
      <PermissionGate permission="manage:fleet">
        <Button>Add Aircraft</Button>
      </PermissionGate>

      {/* Multiple permissions (ANY) */}
      <PermissionGate permissions={['manage:fleet', 'view:fleet']}>
        <div>Visible if user has any of these permissions</div>
      </PermissionGate>

      {/* Multiple permissions (ALL required) */}
      <PermissionGate
        permissions={['manage:fleet', 'manage:maintenance']}
        requireAll
      >
        <div>Visible only if user has ALL permissions</div>
      </PermissionGate>

      {/* With fallback */}
      <PermissionGate
        permission="manage:fleet"
        fallback={<span>View only mode</span>}
      >
        <Button>Edit</Button>
      </PermissionGate>
    </div>
  )
}
```

#### Method 2: usePermissions Hook

```tsx
import { usePermissions } from '@/hooks'

function FleetPage() {
  const { can, canAny, canAll, role, permissions } = usePermissions()

  // Check single permission
  const canManageFleet = can('manage:fleet')

  // Check any of multiple permissions
  const canDoSomething = canAny(['manage:fleet', 'manage:parts'])

  // Check all permissions required
  const isFullAdmin = canAll(['manage:fleet', 'manage:team', 'manage:parts'])

  // Get current role
  console.log('Current role:', role)  // 'scheduler', 'mechanic', etc.

  // Get all permissions for current role
  console.log('Permissions:', permissions)  // ['view:dashboard', 'view:fleet', ...]

  return (
    <div>
      {canManageFleet && <Button>Add Aircraft</Button>}

      <Table>
        <TableRow
          onClick={() => canManageFleet && openEditDialog()}
          className={canManageFleet ? 'cursor-pointer' : ''}
        >
          {/* ... */}
        </TableRow>
      </Table>
    </div>
  )
}
```

### Sidebar Permission Filtering

The sidebar automatically filters navigation items:

```tsx
// src/components/layout/sidebar.tsx
const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/', permission: 'view:dashboard' },
  { title: 'Fleet', href: '/fleet', permission: 'view:fleet' },
  { title: 'Reports', href: '/reports', permission: 'view:reports' },
  // ...
]

// Filtered based on user permissions
const visibleNavItems = navItems.filter(
  (item) => !item.permission || can(item.permission)
)
```

### Adding New Permissions

1. Add the permission type:
```typescript
// src/lib/rbac.ts
export type Permission =
  | 'view:dashboard'
  // ... existing
  | 'view:newfeature'    // Add new permission
  | 'manage:newfeature'
```

2. Assign to roles:
```typescript
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    // ... existing
    'view:newfeature',
    'manage:newfeature',
  ],
  tenant_admin: [
    // ... existing
    'view:newfeature',
    'manage:newfeature',
  ],
  scheduler: [
    'view:newfeature',  // Can view but not manage
  ],
  mechanic: [
    'view:newfeature',
  ],
  auditor: [
    'view:newfeature',
  ],
}
```

3. Use in components:
```tsx
<PermissionGate permission="manage:newfeature">
  <Button>Create New Thing</Button>
</PermissionGate>
```

---

## Component Patterns

### Page Component Pattern

```tsx
// src/features/myfeature/myfeature-page.tsx
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Search, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PermissionGate } from '@/components/permission-gate'
import { usePermissions } from '@/hooks'
import { useAppSelector } from '@/app/store'
import {
  useGetMyEntitiesQuery,
  useCreateMyEntityMutation,
} from '@/lib/api'
import { MyEntityForm } from './myentity-form'

export function MyFeaturePage() {
  // Local UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MyEntity | null>(null)

  // Auth state
  const { orgId } = useAppSelector((state) => state.auth)
  const { can } = usePermissions()
  const canManage = can('manage:myfeature')

  // API hooks
  const { data, isLoading, isError, refetch } = useGetMyEntitiesQuery({})
  const [createEntity, { isLoading: isCreating }] = useCreateMyEntityMutation()

  // Handlers
  const handleCreate = async (data: MyEntityRequest) => {
    try {
      await createEntity(data).unwrap()
      toast.success('Created successfully')
      setFormOpen(false)
    } catch {
      toast.error('Failed to create')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Feature</h1>
          <p className="text-muted-foreground">Description here</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <PermissionGate permission="manage:myfeature">
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Search/Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32" />
          ) : isError ? (
            <p className="text-destructive">Error loading data</p>
          ) : (
            <div>{/* Render data */}</div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <MyEntityForm
        open={formOpen}
        onOpenChange={setFormOpen}
        entity={selectedItem}
        onSubmit={handleCreate}
        isLoading={isCreating}
      />
    </div>
  )
}
```

### Form Component Pattern

```tsx
// src/features/myfeature/myentity-form.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Validation schema
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  value: z.coerce.number().min(0, 'Must be positive'),
})

type FormValues = z.infer<typeof formSchema>

interface MyEntityFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entity: MyEntity | null  // null = create mode
  onSubmit: (data: FormValues) => Promise<void>
  onDelete?: () => Promise<void>
  isLoading?: boolean
}

export function MyEntityForm({
  open,
  onOpenChange,
  entity,
  onSubmit,
  onDelete,
  isLoading,
}: MyEntityFormProps) {
  const isEditing = !!entity

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      value: 0,
    },
  })

  // Reset form when entity changes
  useEffect(() => {
    if (entity) {
      form.reset({
        name: entity.name,
        value: entity.value,
      })
    } else {
      form.reset({ name: '', value: 0 })
    }
  }, [entity, form])

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Entity' : 'Create Entity'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              {isEditing && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  disabled={isLoading}
                >
                  Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Adding New Features

### Step-by-Step Guide

#### 1. Create Feature Folder

```bash
mkdir src/features/newfeature
```

#### 2. Create Page Component

```tsx
// src/features/newfeature/newfeature-page.tsx
export function NewFeaturePage() {
  return <div>New Feature</div>
}
```

#### 3. Create Index File

```tsx
// src/features/newfeature/index.ts
export { NewFeaturePage } from './newfeature-page'
```

#### 4. Add API Endpoints (if needed)

```typescript
// src/lib/api.ts - add to endpoints
getNewFeatureItems: builder.query<NewFeatureItem[], void>({
  query: () => '/new-feature',
  providesTags: ['NewFeature'],
}),
```

#### 5. Add Permissions (if needed)

```typescript
// src/lib/rbac.ts
type Permission =
  | /* existing */
  | 'view:newfeature'
  | 'manage:newfeature'

// Add to role mappings
```

#### 6. Add Route

```tsx
// src/app/router.tsx
import { NewFeaturePage } from '@/features/newfeature'

// Add to children array:
{
  path: 'newfeature',
  element: <NewFeaturePage />,
},
```

#### 7. Add Sidebar Navigation

```tsx
// src/components/layout/sidebar.tsx
const navItems: NavItem[] = [
  // ... existing
  {
    title: 'New Feature',
    href: '/newfeature',
    icon: SomeIcon,
    permission: 'view:newfeature',
  },
]
```

---

## Styling Guide

### Tailwind CSS

Use Tailwind utility classes for styling:

```tsx
<div className="flex items-center justify-between p-4 bg-card rounded-lg border">
  <span className="text-sm text-muted-foreground">Label</span>
  <span className="text-2xl font-bold text-primary">Value</span>
</div>
```

### CSS Variables (Theme)

Colors are defined as CSS variables in `src/index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  /* ... */
}
```

Use via Tailwind: `bg-background`, `text-foreground`, `text-muted-foreground`, etc.

### cn() Utility

Merge class names conditionally:

```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  variant === 'large' && 'text-lg'
)}>
```

---

## Testing Permissions

### Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@demo.local | password123 | admin |
| tenant-admin@demo.local | password123 | tenant_admin |
| scheduler@demo.local | password123 | scheduler |
| mechanic@demo.local | password123 | mechanic |
| auditor@demo.local | password123 | auditor |

### What to Test

1. **mechanic@demo.local** - Most restricted:
   - ❌ No "Reports" in sidebar
   - ❌ No "Add" buttons anywhere
   - ✅ Can view all data
   - ✅ Can complete tasks

2. **auditor@demo.local** - View-only:
   - ✅ Has "Reports" in sidebar
   - ❌ No "Add" buttons
   - ✅ Can export reports

3. **scheduler@demo.local** - Task management:
   - ✅ Can create/assign tasks
   - ❌ Cannot add aircraft
   - ❌ Cannot manage team

4. **tenant-admin@demo.local** - Full org access:
   - ✅ All buttons visible
   - ✅ Full CRUD on all entities

---

## Common Patterns Quick Reference

### Loading States
```tsx
{isLoading ? <Skeleton className="h-8 w-32" /> : <span>{data}</span>}
```

### Error Handling
```tsx
try {
  await mutation(data).unwrap()
  toast.success('Success!')
} catch (error) {
  toast.error('Something went wrong')
}
```

### Permission Check
```tsx
const { can } = usePermissions()
if (can('manage:fleet')) { /* show edit button */ }
```

### Form Validation
```tsx
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
})
```

---

## Need Help?

- Check existing feature implementations in `src/features/`
- Review the RTK Query docs: https://redux-toolkit.js.org/rtk-query/overview
- shadcn/ui components: https://ui.shadcn.com/docs/components
- Tailwind CSS: https://tailwindcss.com/docs
