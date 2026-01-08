import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Filter, Calendar, Clock, User, RefreshCw, Edit, Trash2, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Pagination } from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { TaskStatusBadge } from '@/components/task-status-badge'
import { TaskForm } from './task-form'
import { PermissionGate } from '@/components/permission-gate'
import { usePermissions } from '@/hooks'
import { useAppSelector } from '@/app/store'
import {
  useGetTasksQuery,
  useGetAircraftListQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useTransitionTaskStateMutation,
  type ApiTask,
  type ApiAircraft,
  type ApiTaskState,
} from '@/lib/api'

// Display task type for UI
interface DisplayTask {
  id: string
  title: string
  description: string
  tailNumber: string
  aircraftType: string
  aircraftId: string
  type: string
  status: string
  priority: string
  scheduledStart: string
  scheduledEnd: string
  assignedTo: string[]
  estimatedHours: number
  location: string
}

// Mock data for demo mode
const mockTasks: DisplayTask[] = [
  {
    id: '1',
    title: 'C-Check Inspection',
    description: 'Complete C-Check inspection including structural checks.',
    tailNumber: 'N12345',
    aircraftType: 'Boeing 737-800',
    aircraftId: '1',
    type: 'inspection',
    status: 'in_progress',
    priority: 'high',
    scheduledStart: '2024-12-28',
    scheduledEnd: '2024-12-30',
    assignedTo: ['Mike Johnson', 'Sarah Chen'],
    estimatedHours: 48,
    location: 'Hangar A',
  },
  {
    id: '2',
    title: 'Engine Borescope Inspection',
    description: 'Perform borescope inspection on both engines.',
    tailNumber: 'N67890',
    aircraftType: 'Airbus A320',
    aircraftId: '2',
    type: 'inspection',
    status: 'scheduled',
    priority: 'medium',
    scheduledStart: '2024-12-29',
    scheduledEnd: '2024-12-29',
    assignedTo: ['John Smith'],
    estimatedHours: 8,
    location: 'Hangar B',
  },
  {
    id: '3',
    title: 'Landing Gear Overhaul',
    description: 'Complete overhaul of main landing gear assembly.',
    tailNumber: 'N24680',
    aircraftType: 'Embraer E175',
    aircraftId: '3',
    type: 'overhaul',
    status: 'scheduled',
    priority: 'high',
    scheduledStart: '2024-12-28',
    scheduledEnd: '2024-12-31',
    assignedTo: ['Mike Johnson', 'Tom Wilson'],
    estimatedHours: 72,
    location: 'Hangar A',
  },
  {
    id: '4',
    title: 'APU Repair',
    description: 'Repair auxiliary power unit following fault indication.',
    tailNumber: 'N11111',
    aircraftType: 'Boeing 777-300',
    aircraftId: '4',
    type: 'repair',
    status: 'completed',
    priority: 'medium',
    scheduledStart: '2024-12-25',
    scheduledEnd: '2024-12-27',
    assignedTo: ['Sarah Chen'],
    estimatedHours: 24,
    location: 'Hangar C',
  },
  {
    id: '5',
    title: 'A-Check Line Maintenance',
    description: 'Routine A-Check maintenance per schedule.',
    tailNumber: 'N22222',
    aircraftType: 'Airbus A321',
    aircraftId: '5',
    type: 'inspection',
    status: 'scheduled',
    priority: 'low',
    scheduledStart: '2025-01-02',
    scheduledEnd: '2025-01-03',
    assignedTo: ['Amy Lee'],
    estimatedHours: 16,
    location: 'Hangar B',
  },
]

const typeLabels: Record<string, string> = {
  inspection: 'Inspection',
  repair: 'Repair',
  overhaul: 'Overhaul',
}

const priorityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

// Transform API task to display task
function transformTask(task: ApiTask, aircraft: ApiAircraft | undefined): DisplayTask {
  return {
    id: task.id,
    title: `${task.type.charAt(0).toUpperCase() + task.type.slice(1)} Task`,
    description: task.notes || 'No description',
    tailNumber: aircraft?.tail_number || 'Unknown',
    aircraftType: aircraft?.model || 'Unknown',
    aircraftId: task.aircraft_id,
    type: task.type,
    status: task.state,
    priority: 'medium', // API doesn't have priority, default to medium
    scheduledStart: task.start_time.split('T')[0],
    scheduledEnd: task.end_time.split('T')[0],
    assignedTo: task.assigned_mechanic_id ? ['Assigned'] : [],
    estimatedHours: Math.round((new Date(task.end_time).getTime() - new Date(task.start_time).getTime()) / (1000 * 60 * 60)),
    location: 'Hangar',
  }
}

export function MaintenancePage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState<DisplayTask | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<DisplayTask | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<DisplayTask | null>(null)
  const [transitioningTaskId, setTransitioningTaskId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { orgId, isAuthenticated } = useAppSelector((state) => state.auth)
  const { can } = usePermissions()
  const canManageMaintenance = can('manage:maintenance')
  const isDemo = !isAuthenticated || !orgId

  // RTK Query hooks
  const { data: apiTasks, isLoading, error, refetch, isFetching } = useGetTasksQuery(
    { state: statusFilter === 'all' ? undefined : statusFilter },
    { skip: isDemo }
  )
  const { data: apiAircraft } = useGetAircraftListQuery({}, { skip: isDemo })
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation()
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation()
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation()
  const [transitionTaskState] = useTransitionTaskStateMutation()

  // Transform API data or use mock data
  const tasks: DisplayTask[] = isDemo
    ? mockTasks
    : (apiTasks || []).map((task) => {
        const aircraft = apiAircraft?.find((a) => a.id === task.aircraft_id)
        return transformTask(task, aircraft)
      })

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      const matchesType = typeFilter === 'all' || task.type === typeFilter
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tailNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesType && matchesSearch
    })
  }, [tasks, statusFilter, typeFilter, searchQuery])

  // Paginate filtered tasks
  const paginatedTasks = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredTasks.slice(startIndex, startIndex + pageSize)
  }, [filteredTasks, page, pageSize])

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value)
    setPage(1)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }

  const stats = {
    total: tasks.length,
    scheduled: tasks.filter((t) => t.status === 'scheduled').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  }

  const handleCreateClick = () => {
    setEditingTask(null)
    setFormOpen(true)
  }

  const handleEditClick = (task: DisplayTask) => {
    setEditingTask(task)
    setFormOpen(true)
    setSelectedTask(null)
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      if (editingTask && !isDemo) {
        await updateTask({
          id: editingTask.id,
          data: {
            type: data.type as 'inspection' | 'repair' | 'overhaul',
            start_time: data.start_time as string,
            end_time: data.end_time as string,
            notes: data.notes as string,
          }
        }).unwrap()
        toast.success('Task updated successfully')
      } else if (!isDemo) {
        await createTask({
          aircraft_id: data.aircraft_id as string,
          type: data.type as 'inspection' | 'repair' | 'overhaul',
          start_time: data.start_time as string,
          end_time: data.end_time as string,
          notes: data.notes as string,
        }).unwrap()
        toast.success('Task created successfully')
      } else {
        toast.success(editingTask ? 'Task updated (demo)' : 'Task created (demo)')
      }
      setFormOpen(false)
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error('Failed to save task. Please try again.')
    }
  }

  const handleDeleteClick = (task: DisplayTask, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setTaskToDelete(task)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!taskToDelete || isDemo) {
      setDeleteDialogOpen(false)
      return
    }
    try {
      await deleteTask({ id: taskToDelete.id }).unwrap()
      toast.success('Task deleted successfully')
      setDeleteDialogOpen(false)
      setTaskToDelete(null)
      setSelectedTask(null)
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task. Please try again.')
    }
  }

  const handleTransitionState = async (taskId: string, newState: ApiTaskState, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (isDemo) {
      toast.success(`Task ${newState === 'in_progress' ? 'started' : newState === 'completed' ? 'completed' : 'cancelled'} (demo)`)
      return
    }
    setTransitioningTaskId(taskId)
    try {
      await transitionTaskState({
        id: taskId,
        data: {
          new_state: newState,
          allow_early_completion: true,
          allow_late_cancel: true,
        }
      }).unwrap()
      toast.success(`Task ${newState === 'in_progress' ? 'started' : newState === 'completed' ? 'completed' : 'cancelled'} successfully`)
      setSelectedTask(null)
    } catch (error) {
      console.error('Error transitioning task:', error)
      toast.error('Failed to update task status. Please try again.')
    } finally {
      setTransitioningTaskId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground">
            Manage maintenance tasks and schedules
            {isDemo && <span className="ml-2 text-xs text-amber-600">(Demo Data)</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isDemo || isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <PermissionGate permission="manage:maintenance">
            <Button onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Error Alert */}
      {error && !isDemo && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load maintenance tasks. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !isDemo ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Scheduled</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !isDemo ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !isDemo ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !isDemo ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={handleFilterChange(setTypeFilter)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="inspection">Inspection</SelectItem>
            <SelectItem value="repair">Repair</SelectItem>
            <SelectItem value="overhaul">Overhaul</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Aircraft</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && !isDemo ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    {filteredTasks.length === 0 ? 'No tasks found' : 'No tasks on this page'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedTask(task)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {task.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-mono font-semibold">{task.tailNumber}</div>
                        <div className="text-sm text-muted-foreground">{task.aircraftType}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeLabels[task.type] || task.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <TaskStatusBadge status={task.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled'} />
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[task.priority] || priorityColors.medium}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {task.scheduledStart}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {task.assignedTo.slice(0, 2).map((name, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                        {task.assignedTo.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{task.assignedTo.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {/* State transition buttons */}
                        {canManageMaintenance && task.status === 'scheduled' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Start Task"
                            disabled={transitioningTaskId === task.id}
                            onClick={(e) => handleTransitionState(task.id, 'in_progress', e)}
                          >
                            {transitioningTaskId === task.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4 text-blue-600" />
                            )}
                          </Button>
                        )}
                        {canManageMaintenance && task.status === 'in_progress' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Complete Task"
                            disabled={transitioningTaskId === task.id}
                            onClick={(e) => handleTransitionState(task.id, 'completed', e)}
                          >
                            {transitioningTaskId === task.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        )}
                        {canManageMaintenance && (task.status === 'scheduled' || task.status === 'in_progress') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Cancel Task"
                            disabled={transitioningTaskId === task.id}
                            onClick={(e) => handleTransitionState(task.id, 'cancelled', e)}
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                        {canManageMaintenance && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit Task"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditClick(task)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canManageMaintenance && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete Task"
                            onClick={(e) => handleDeleteClick(task, e)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {filteredTasks.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filteredTasks.length}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[10, 25, 50]}
        />
      )}

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>
              {selectedTask?.tailNumber} - {selectedTask?.aircraftType}
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <TaskStatusBadge status={selectedTask.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled'} />
                <Badge className={priorityColors[selectedTask.priority] || priorityColors.medium}>
                  {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)}
                </Badge>
                <Badge variant="outline">{typeLabels[selectedTask.type] || selectedTask.type}</Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Schedule
                  </div>
                  <div className="font-medium">
                    {selectedTask.scheduledStart} - {selectedTask.scheduledEnd}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Estimated Hours
                  </div>
                  <div className="font-medium">{selectedTask.estimatedHours}h</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Assigned To
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedTask.assignedTo.map((name, i) => (
                      <Badge key={i} variant="secondary">{name}</Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div className="font-medium">{selectedTask.location}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Description</div>
                <p>{selectedTask.description}</p>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                {/* State transition buttons */}
                {canManageMaintenance && selectedTask.status === 'scheduled' && (
                  <Button
                    variant="outline"
                    disabled={transitioningTaskId === selectedTask.id}
                    onClick={() => handleTransitionState(selectedTask.id, 'in_progress')}
                  >
                    {transitioningTaskId === selectedTask.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    Start Task
                  </Button>
                )}
                {canManageMaintenance && selectedTask.status === 'in_progress' && (
                  <Button
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    disabled={transitioningTaskId === selectedTask.id}
                    onClick={() => handleTransitionState(selectedTask.id, 'completed')}
                  >
                    {transitioningTaskId === selectedTask.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Complete
                  </Button>
                )}
                {canManageMaintenance && (selectedTask.status === 'scheduled' || selectedTask.status === 'in_progress') && (
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => handleTransitionState(selectedTask.id, 'cancelled')}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedTask(null)}>
                  Close
                </Button>
                {canManageMaintenance && (
                  <Button onClick={() => handleEditClick(selectedTask)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
                {canManageMaintenance && (
                  <Button variant="destructive" onClick={() => handleDeleteClick(selectedTask)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
              {taskToDelete && (
                <span className="block mt-2 font-medium text-foreground">
                  {taskToDelete.title} - {taskToDelete.tailNumber}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Task Form */}
      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editingTask}
        onSubmit={handleSubmit}
        isLoading={isCreating || isUpdating}
      />
    </div>
  )
}
