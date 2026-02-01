import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/app/store'
import { logout, setCredentials } from '@/features/auth/auth-slice'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

// ============ API Types (matching backend OpenAPI spec) ============

// Auth
export interface LoginRequest {
  org_id: string
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface RefreshRequest {
  refresh_token: string
}

export interface LookupRequest {
  email: string
}

export interface OrgInfo {
  org_id: string
  org_name: string
}

export interface LookupResponse {
  organizations: OrgInfo[]
}

// User (backend schema)
export type ApiUserRole = 'admin' | 'tenant_admin' | 'scheduler' | 'mechanic' | 'auditor'

export interface ApiUser {
  id: string
  org_id: string
  email: string
  role: ApiUserRole
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface UserCreateRequest {
  org_id?: string
  email: string
  role: ApiUserRole
  password: string
}

export interface UserUpdateRequest {
  org_id?: string
  email?: string
  role?: ApiUserRole
  password?: string
}

// Aircraft (backend schema)
export type ApiAircraftStatus = 'operational' | 'maintenance' | 'grounded'

export interface ApiAircraft {
  id: string
  org_id: string
  tail_number: string
  model: string
  last_maintenance: string | null
  next_due: string | null
  status: ApiAircraftStatus
  capacity_slots: number
  flight_hours_total?: number
  cycles_total?: number
  created_at: string
  updated_at: string
}

export interface AircraftCreateRequest {
  org_id?: string
  tail_number: string
  model: string
  last_maintenance?: string
  next_due?: string
  status?: ApiAircraftStatus
  capacity_slots: number
  flight_hours_total?: number
  cycles_total?: number
}

export interface AircraftUpdateRequest {
  org_id?: string
  tail_number?: string
  model?: string
  last_maintenance?: string
  next_due?: string
  status?: ApiAircraftStatus
  capacity_slots?: number
  flight_hours_total?: number
  cycles_total?: number
}

// Maintenance Task (backend schema)
export type ApiTaskType = 'inspection' | 'repair' | 'overhaul'
export type ApiTaskState = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export interface ApiTask {
  id: string
  org_id: string
  aircraft_id: string
  program_id: string | null
  type: ApiTaskType
  state: ApiTaskState
  start_time: string
  end_time: string
  assigned_mechanic_id: string | null
  notes: string
  created_at: string
  updated_at: string
}

export interface TaskCreateRequest {
  org_id?: string
  aircraft_id: string
  program_id?: string
  type: ApiTaskType
  start_time: string
  end_time: string
  assigned_mechanic_id?: string
  notes?: string
}

export interface TaskUpdateRequest {
  org_id?: string
  program_id?: string
  type?: ApiTaskType
  start_time?: string
  end_time?: string
  assigned_mechanic_id?: string
  notes?: string
}

export interface TaskStateRequest {
  new_state: ApiTaskState
  allow_early_completion?: boolean
  allow_late_cancel?: boolean
  require_all_parts_used?: boolean
  notes?: string
}

export interface TaskStateResponse {
  id: string
  state: ApiTaskState
}

export interface TaskDetail {
  task: ApiTask
  reservations: ApiPartReservation[]
  compliance: ApiComplianceItem[]
}

// Maintenance Program (backend schema)
export type ApiIntervalType = 'flight_hours' | 'cycles' | 'calendar'

export interface ApiMaintenanceProgram {
  id: string
  org_id: string
  aircraft_id: string | null
  name: string
  interval_type: ApiIntervalType
  interval_value: number
  last_performed: string | null
  created_at: string
  updated_at: string
}

export interface MaintenanceProgramCreateRequest {
  org_id?: string
  aircraft_id?: string
  name: string
  interval_type: ApiIntervalType
  interval_value: number
  last_performed?: string
}

export interface MaintenanceProgramUpdateRequest {
  org_id?: string
  aircraft_id?: string
  name?: string
  interval_type?: ApiIntervalType
  interval_value?: number
  last_performed?: string
}

// Parts (backend schema)
export interface ApiPartDefinition {
  id: string
  org_id: string
  name: string
  category: string
  created_at: string
  updated_at: string
}

export interface PartDefinitionRequest {
  org_id?: string
  name: string
  category: string
}

export type ApiPartItemStatus = 'in_stock' | 'used' | 'disposed'

export interface ApiPartItem {
  id: string
  org_id: string
  part_definition_id: string
  serial_number: string
  status: ApiPartItemStatus
  expiry_date: string | null
  created_at: string
  updated_at: string
}

export interface PartItemCreateRequest {
  org_id?: string
  part_definition_id: string
  serial_number: string
  status?: ApiPartItemStatus
  expiry_date?: string
}

export interface PartItemUpdateRequest {
  org_id?: string
  status?: ApiPartItemStatus
  expiry_date?: string
}

// Part Reservations
export type ApiReservationState = 'reserved' | 'released' | 'used'

export interface ApiPartReservation {
  id: string
  task_id: string
  part_item_id: string
  state: ApiReservationState
}

export interface PartReservationRequest {
  task_id: string
  part_item_id: string
}

export interface ReservationStateRequest {
  new_state: 'released' | 'used'
}

// Compliance (backend schema)
export type ApiComplianceResult = 'pass' | 'fail' | 'pending'

export interface ApiComplianceItem {
  id: string
  task_id: string
  description: string
  result: ApiComplianceResult
  signed_off: boolean
}

export interface ComplianceCreateRequest {
  task_id: string
  description: string
  result: ApiComplianceResult
}

export interface ComplianceUpdateRequest {
  description: string
  result: ApiComplianceResult
}

// Audit Log
export interface ApiAuditLogChange {
  field: string
  old_value: unknown
  new_value: unknown
}

export interface ApiAuditLogDetails {
  resource_name?: string
  changes?: ApiAuditLogChange[]
  action_type?: string
  [key: string]: unknown
}

export interface ApiAuditLog {
  id: string
  org_id: string
  entity_type: string
  entity_id: string
  action: string
  user_id: string
  request_id: string
  ip_address: string
  user_agent: string
  entity_version: number
  timestamp: string
  details: ApiAuditLogDetails
}

// Organization
export interface ApiOrganization {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface OrganizationRequest {
  name: string
}

// Reports
export interface ReportSummary {
  tasks: {
    scheduled: number
    in_progress: number
    completed: number
    cancelled: number
  }
  aircraft: {
    total: number
  }
  parts: {
    in_stock: number
    used: number
    disposed: number
  }
  compliance: {
    pending: number
    signed: number
  }
}

export interface ComplianceReport {
  total: number
  pass: number
  fail: number
  pending: number
  signed: number
  unsigned: number
}

// Imports
export type ApiImportType = 'aircraft' | 'parts' | 'programs'
export type ApiImportStatus = 'pending' | 'validating' | 'applying' | 'completed' | 'failed'

export interface ApiImport {
  id: string
  org_id: string
  type: ApiImportType
  status: ApiImportStatus
  file_name: string
  created_by: string
  summary: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ApiImportRow {
  id: string
  row_number: number
  status: 'pending' | 'valid' | 'invalid' | 'applied'
  errors: string[]
  raw: Record<string, unknown>
  created_at: string
  updated_at: string
}

// Webhooks
export interface ApiWebhook {
  id: string
  org_id: string
  url: string
  events: string[]
  secret?: string
  created_at: string
  updated_at: string
}

export interface WebhookCreateRequest {
  org_id?: string
  url: string
  events: string[]
}

// Error response
export interface ApiError {
  error: string
  code: 'auth' | 'forbidden' | 'validation' | 'conflict' | 'not_found' | 'rate_limited' | 'internal' | 'unavailable'
  request_id?: string
}

// Query params
export interface ListParams {
  limit?: number
  offset?: number
}

export interface AircraftListParams extends ListParams {
  org_id?: string
  status?: string
  model?: string
  tail_number?: string
}

export interface TaskListParams extends ListParams {
  org_id?: string
  aircraft_id?: string
  state?: string
  type?: string
  start_from?: string
  start_to?: string
}

export interface UserListParams extends ListParams {
  org_id?: string
  role?: string
  email?: string
}

export interface PartDefinitionListParams extends ListParams {
  org_id?: string
  name?: string
}

export interface PartItemListParams extends ListParams {
  org_id?: string
  definition_id?: string
  status?: string
  expiry_before?: string
}

export interface ComplianceListParams extends ListParams {
  org_id?: string
  task_id?: string
  result?: string
  signed?: boolean
}

export interface AuditLogListParams extends ListParams {
  org_id?: string
  entity_type?: string
  entity_id?: string
  user_id?: string
  from?: string
  to?: string
}

// ============ Base Query with Auth ============

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})

// Wrapper to handle token refresh
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Skip API calls entirely for demo tokens
  const token = (api.getState() as RootState).auth.token
  if (token?.startsWith('demo-token-')) {
    return { error: { status: 403, data: 'Demo mode' } as FetchBaseQueryError }
  }

  let result = await baseQuery(args, api, extraOptions)

  if (result.error && result.error.status === 401) {
    // Try to refresh token
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refresh_token: refreshToken },
        },
        api,
        extraOptions
      )

      if (refreshResult.data) {
        const data = refreshResult.data as TokenResponse
        // Store new tokens
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        api.dispatch(setCredentials({
          token: data.access_token,
          user: (api.getState() as RootState).auth.user!
        }))
        // Retry original request
        result = await baseQuery(args, api, extraOptions)
      } else {
        // Refresh failed, logout
        api.dispatch(logout())
      }
    } else {
      api.dispatch(logout())
    }
  }

  return result
}

// ============ RTK Query API ============

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Aircraft', 'Task', 'Part', 'PartItem', 'Compliance', 'User', 'AuditLog', 'Program', 'Organization', 'Webhook', 'Report'],
  endpoints: (builder) => ({
    // ============ Auth ============
    login: builder.mutation<TokenResponse, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    refreshToken: builder.mutation<TokenResponse, RefreshRequest>({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
    }),
    logout: builder.mutation<void, RefreshRequest>({
      query: (body) => ({
        url: '/auth/logout',
        method: 'POST',
        body,
      }),
    }),
    lookupEmail: builder.mutation<LookupResponse, LookupRequest>({
      query: (body) => ({
        url: '/auth/lookup',
        method: 'POST',
        body,
      }),
    }),
    getMe: builder.query<ApiUser, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    // ============ Organizations ============
    getOrganizations: builder.query<ApiOrganization[], ListParams>({
      query: (params) => ({
        url: '/organizations',
        params,
      }),
      providesTags: ['Organization'],
    }),
    getOrganization: builder.query<ApiOrganization, string>({
      query: (id) => `/organizations/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Organization', id }],
    }),
    createOrganization: builder.mutation<ApiOrganization, OrganizationRequest>({
      query: (body) => ({
        url: '/organizations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Organization'],
    }),
    updateOrganization: builder.mutation<ApiOrganization, { id: string; data: OrganizationRequest }>({
      query: ({ id, data }) => ({
        url: `/organizations/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Organization', id }, 'Organization'],
    }),

    // ============ Users ============
    getUsers: builder.query<ApiUser[], UserListParams>({
      query: (params) => ({
        url: '/users',
        params,
      }),
      providesTags: ['User'],
    }),
    getUser: builder.query<ApiUser, { id: string; org_id?: string }>({
      query: ({ id, org_id }) => ({
        url: `/users/${id}`,
        params: org_id ? { org_id } : undefined,
      }),
      providesTags: (_r, _e, { id }) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation<ApiUser, UserCreateRequest>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<ApiUser, { id: string; data: UserUpdateRequest }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'User', id }, 'User'],
    }),
    deleteUser: builder.mutation<void, { id: string; org_id?: string }>({
      query: ({ id, org_id }) => ({
        url: `/users/${id}`,
        method: 'DELETE',
        params: org_id ? { org_id } : undefined,
      }),
      invalidatesTags: ['User'],
    }),

    // ============ Aircraft ============
    getAircraftList: builder.query<ApiAircraft[], AircraftListParams>({
      query: (params) => ({
        url: '/aircraft',
        params,
      }),
      providesTags: ['Aircraft'],
    }),
    getAircraft: builder.query<ApiAircraft, { id: string; org_id?: string }>({
      query: ({ id, org_id }) => ({
        url: `/aircraft/${id}`,
        params: org_id ? { org_id } : undefined,
      }),
      providesTags: (_r, _e, { id }) => [{ type: 'Aircraft', id }],
    }),
    createAircraft: builder.mutation<ApiAircraft, AircraftCreateRequest>({
      query: (body) => ({
        url: '/aircraft',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Aircraft', 'Report'],
    }),
    updateAircraft: builder.mutation<ApiAircraft, { id: string; data: AircraftUpdateRequest }>({
      query: ({ id, data }) => ({
        url: `/aircraft/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Aircraft', id }, 'Aircraft', 'Report'],
    }),
    deleteAircraft: builder.mutation<void, { id: string; org_id?: string }>({
      query: ({ id, org_id }) => ({
        url: `/aircraft/${id}`,
        method: 'DELETE',
        params: org_id ? { org_id } : undefined,
      }),
      invalidatesTags: ['Aircraft', 'Report'],
    }),

    // ============ Maintenance Tasks ============
    getTasks: builder.query<ApiTask[], TaskListParams>({
      query: (params) => ({
        url: '/maintenance-tasks',
        params,
      }),
      providesTags: ['Task'],
    }),
    getTask: builder.query<TaskDetail, { id: string; org_id?: string }>({
      query: ({ id, org_id }) => ({
        url: `/maintenance-tasks/${id}`,
        params: org_id ? { org_id } : undefined,
      }),
      providesTags: (_r, _e, { id }) => [{ type: 'Task', id }],
    }),
    createTask: builder.mutation<ApiTask, TaskCreateRequest>({
      query: (body) => ({
        url: '/maintenance-tasks',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Task', 'Aircraft', 'Report'],
    }),
    updateTask: builder.mutation<ApiTask, { id: string; data: TaskUpdateRequest }>({
      query: ({ id, data }) => ({
        url: `/maintenance-tasks/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Task', id }, 'Task', 'Report'],
    }),
    deleteTask: builder.mutation<void, { id: string; org_id?: string }>({
      query: ({ id, org_id }) => ({
        url: `/maintenance-tasks/${id}`,
        method: 'DELETE',
        params: org_id ? { org_id } : undefined,
      }),
      invalidatesTags: ['Task', 'Report'],
    }),
    transitionTaskState: builder.mutation<TaskStateResponse, { id: string; data: TaskStateRequest }>({
      query: ({ id, data }) => ({
        url: `/maintenance-tasks/${id}/state`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Task', id }, 'Task', 'Aircraft', 'Report'],
    }),

    // ============ Maintenance Programs ============
    getPrograms: builder.query<ApiMaintenanceProgram[], { org_id?: string; aircraft_id?: string } & ListParams>({
      query: (params) => ({
        url: '/maintenance-programs',
        params,
      }),
      providesTags: ['Program'],
    }),
    getProgram: builder.query<ApiMaintenanceProgram, { id: string; org_id?: string }>({
      query: ({ id, org_id }) => ({
        url: `/maintenance-programs/${id}`,
        params: org_id ? { org_id } : undefined,
      }),
      providesTags: (_r, _e, { id }) => [{ type: 'Program', id }],
    }),
    createProgram: builder.mutation<ApiMaintenanceProgram, MaintenanceProgramCreateRequest>({
      query: (body) => ({
        url: '/maintenance-programs',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Program'],
    }),
    updateProgram: builder.mutation<ApiMaintenanceProgram, { id: string; data: MaintenanceProgramUpdateRequest }>({
      query: ({ id, data }) => ({
        url: `/maintenance-programs/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Program', id }, 'Program'],
    }),
    deleteProgram: builder.mutation<void, { id: string; org_id?: string }>({
      query: ({ id, org_id }) => ({
        url: `/maintenance-programs/${id}`,
        method: 'DELETE',
        params: org_id ? { org_id } : undefined,
      }),
      invalidatesTags: ['Program'],
    }),

    // ============ Part Definitions ============
    getPartDefinitions: builder.query<ApiPartDefinition[], PartDefinitionListParams>({
      query: (params) => ({
        url: '/part-definitions',
        params,
      }),
      providesTags: ['Part'],
    }),
    createPartDefinition: builder.mutation<ApiPartDefinition, PartDefinitionRequest>({
      query: (body) => ({
        url: '/part-definitions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Part'],
    }),
    updatePartDefinition: builder.mutation<ApiPartDefinition, { id: string; org_id?: string; data: PartDefinitionRequest }>({
      query: ({ id, org_id, data }) => ({
        url: `/part-definitions/${id}`,
        method: 'PATCH',
        params: org_id ? { org_id } : undefined,
        body: data,
      }),
      invalidatesTags: ['Part'],
    }),
    deletePartDefinition: builder.mutation<void, { id: string; org_id?: string }>({
      query: ({ id, org_id }) => ({
        url: `/part-definitions/${id}`,
        method: 'DELETE',
        params: org_id ? { org_id } : undefined,
      }),
      invalidatesTags: ['Part'],
    }),

    // ============ Part Items ============
    getPartItems: builder.query<ApiPartItem[], PartItemListParams>({
      query: (params) => ({
        url: '/part-items',
        params,
      }),
      providesTags: ['PartItem'],
    }),
    createPartItem: builder.mutation<ApiPartItem, PartItemCreateRequest>({
      query: (body) => ({
        url: '/part-items',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PartItem', 'Report'],
    }),
    updatePartItem: builder.mutation<ApiPartItem, { id: string; org_id?: string; data: PartItemUpdateRequest }>({
      query: ({ id, org_id, data }) => ({
        url: `/part-items/${id}`,
        method: 'PATCH',
        params: org_id ? { org_id } : undefined,
        body: data,
      }),
      invalidatesTags: ['PartItem', 'Report'],
    }),
    deletePartItem: builder.mutation<void, { id: string; org_id?: string }>({
      query: ({ id, org_id }) => ({
        url: `/part-items/${id}`,
        method: 'DELETE',
        params: org_id ? { org_id } : undefined,
      }),
      invalidatesTags: ['PartItem', 'Report'],
    }),

    // ============ Part Reservations ============
    reservePart: builder.mutation<ApiPartReservation, PartReservationRequest>({
      query: (body) => ({
        url: '/part-reservations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Task', 'PartItem'],
    }),
    updateReservationState: builder.mutation<ApiPartReservation, { id: string; data: ReservationStateRequest }>({
      query: ({ id, data }) => ({
        url: `/part-reservations/${id}/state`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Task', 'PartItem', 'Report'],
    }),

    // ============ Compliance Items ============
    getComplianceItems: builder.query<ApiComplianceItem[], ComplianceListParams>({
      query: (params) => ({
        url: '/compliance-items',
        params,
      }),
      providesTags: ['Compliance'],
    }),
    createComplianceItem: builder.mutation<ApiComplianceItem, ComplianceCreateRequest>({
      query: (body) => ({
        url: '/compliance-items',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Compliance', 'Task', 'Report'],
    }),
    updateComplianceItem: builder.mutation<ApiComplianceItem, { id: string; data: ComplianceUpdateRequest }>({
      query: ({ id, data }) => ({
        url: `/compliance-items/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Compliance', 'Report'],
    }),
    signOffComplianceItem: builder.mutation<ApiComplianceItem, string>({
      query: (id) => ({
        url: `/compliance-items/${id}/sign-off`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Compliance', 'Task', 'Report'],
    }),

    // ============ Audit Logs ============
    getAuditLogs: builder.query<ApiAuditLog[], AuditLogListParams>({
      query: (params) => ({
        url: '/audit-logs',
        params,
      }),
      providesTags: ['AuditLog'],
    }),
    exportAuditLogs: builder.query<string, AuditLogListParams>({
      query: (params) => ({
        url: '/audit-logs/export',
        params,
        responseHandler: 'text',
      }),
    }),

    // ============ Reports ============
    getReportSummary: builder.query<ReportSummary, { org_id?: string }>({
      query: (params) => ({
        url: '/reports/summary',
        params,
      }),
      providesTags: ['Report'],
    }),
    getComplianceReport: builder.query<ComplianceReport, {
      org_id?: string
      task_id?: string
      result?: ApiComplianceResult
      signed?: boolean
      from?: string
      to?: string
    }>({
      query: (params) => ({
        url: '/reports/compliance',
        params,
      }),
      providesTags: ['Report', 'Compliance'],
    }),

    // ============ Imports ============
    createImport: builder.mutation<ApiImport, FormData>({
      query: (formData) => ({
        url: '/imports/csv',
        method: 'POST',
        body: formData,
      }),
    }),
    getImport: builder.query<ApiImport, { id: string; org_id?: string }>({
      query: ({ id, org_id }) => ({
        url: `/imports/${id}`,
        params: org_id ? { org_id } : undefined,
      }),
    }),
    getImportRows: builder.query<ApiImportRow[], { id: string; org_id?: string; status?: string } & ListParams>({
      query: ({ id, ...params }) => ({
        url: `/imports/${id}/rows`,
        params,
      }),
    }),

    // ============ Webhooks ============
    getWebhooks: builder.query<ApiWebhook[], { org_id?: string }>({
      query: (params) => ({
        url: '/webhooks',
        params,
      }),
      providesTags: ['Webhook'],
    }),
    createWebhook: builder.mutation<ApiWebhook, WebhookCreateRequest>({
      query: (body) => ({
        url: '/webhooks',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Webhook'],
    }),
    deleteWebhook: builder.mutation<void, { id: string; org_id?: string }>({
      query: ({ id, org_id }) => ({
        url: `/webhooks/${id}`,
        method: 'DELETE',
        params: org_id ? { org_id } : undefined,
      }),
      invalidatesTags: ['Webhook'],
    }),
    testWebhook: builder.mutation<{ status: string }, { id: string; org_id?: string }>({
      query: ({ id, org_id }) => ({
        url: `/webhooks/${id}/test`,
        method: 'POST',
        params: org_id ? { org_id } : undefined,
      }),
    }),
  }),
})

// Export hooks
export const {
  // Auth
  useLoginMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useLookupEmailMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  // Organizations
  useGetOrganizationsQuery,
  useGetOrganizationQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  // Users
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  // Aircraft
  useGetAircraftListQuery,
  useGetAircraftQuery,
  useCreateAircraftMutation,
  useUpdateAircraftMutation,
  useDeleteAircraftMutation,
  // Tasks
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useTransitionTaskStateMutation,
  // Programs
  useGetProgramsQuery,
  useGetProgramQuery,
  useCreateProgramMutation,
  useUpdateProgramMutation,
  useDeleteProgramMutation,
  // Part Definitions
  useGetPartDefinitionsQuery,
  useCreatePartDefinitionMutation,
  useUpdatePartDefinitionMutation,
  useDeletePartDefinitionMutation,
  // Part Items
  useGetPartItemsQuery,
  useCreatePartItemMutation,
  useUpdatePartItemMutation,
  useDeletePartItemMutation,
  // Part Reservations
  useReservePartMutation,
  useUpdateReservationStateMutation,
  // Compliance
  useGetComplianceItemsQuery,
  useCreateComplianceItemMutation,
  useUpdateComplianceItemMutation,
  useSignOffComplianceItemMutation,
  // Audit Logs
  useGetAuditLogsQuery,
  useLazyExportAuditLogsQuery,
  // Reports
  useGetReportSummaryQuery,
  useGetComplianceReportQuery,
  // Imports
  useCreateImportMutation,
  useGetImportQuery,
  useGetImportRowsQuery,
  // Webhooks
  useGetWebhooksQuery,
  useCreateWebhookMutation,
  useDeleteWebhookMutation,
  useTestWebhookMutation,
} = api

export { API_BASE_URL }
