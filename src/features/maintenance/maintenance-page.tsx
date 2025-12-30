import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Filter, Calendar, Clock, User, RefreshCw, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
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
  type ApiTask,
  type ApiAircraft,
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

  const { orgId } = useAppSelector((state) => state.auth)
  const { can } = usePermissions()
  const canManageMaintenance = can('manage:maintenance')
  const isDemo = orgId === 'demo-org' || !orgId

  // RTK Query hooks
  const { data: apiTasks, isLoading, refetch } = useGetTasksQuery(
    { state: statusFilter === 'all' ? undefined : statusFilter },
    { skip: isDemo }
  )
  const { data: apiAircraft } = useGetAircraftListQuery({}, { skip: isDemo })
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation()
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation()

  // Transform API data or use mock data
  const tasks: DisplayTask[] = isDemo
    ? mockTasks
    : (apiTasks || []).map((task) => {
        const aircraft = apiAircraft?.find((a) => a.id === task.aircraft_id)
        return transformTask(task, aircraft)
      })

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesType = typeFilter === 'all' || task.type === typeFilter
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tailNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesType && matchesSearch
  })

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
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isDemo}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <PermissionGate permission="manage:maintenance">
            <Button onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </PermissionGate>
        </div>
      </div>

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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
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
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
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
        <CardContent className="p-0">
          <Table>
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
              ) : filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No tasks found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
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
                      {canManageMaintenance && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditClick(task)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedTask(null)}>
                  Close
                </Button>
                {canManageMaintenance && (
                  <Button onClick={() => handleEditClick(selectedTask)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Task
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
