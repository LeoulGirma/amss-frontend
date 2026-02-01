import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { RefreshCw, GripVertical, Clock, User, Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TaskPriorityBadge } from '@/components/task-status-badge'
import { useAppSelector } from '@/app/store'
import {
  useGetTasksQuery,
  useGetAircraftListQuery,
  useTransitionTaskStateMutation,
  type ApiTask,
  type ApiAircraft,
  type ApiTaskState,
} from '@/lib/api'
import type { MaintenanceTask, TaskStatus } from '@/types'

// Column configuration
const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'scheduled', title: 'Scheduled', color: 'bg-blue-500' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-500' },
  { id: 'completed', title: 'Completed', color: 'bg-green-500' },
]

// Mock data
const mockTasks: MaintenanceTask[] = [
  {
    id: '1',
    title: 'C-Check Inspection',
    description: 'Complete C-Check inspection',
    tailNumber: 'N12345',
    aircraftType: 'Boeing 737-800',
    aircraftId: '1',
    type: 'c_check',
    status: 'in_progress',
    priority: 'high',
    scheduledStart: '2024-12-28',
    scheduledEnd: '2024-12-30',
    assignedTo: ['Mike Johnson', 'Sarah Chen'],
    estimatedHours: 48,
    location: 'Hangar A',
    partsRequired: [],
    complianceItems: [],
    notes: '',
    createdBy: 'admin',
    createdAt: '2024-12-20',
    updatedAt: '2024-12-28',
  },
  {
    id: '2',
    title: 'Engine Borescope',
    description: 'Perform borescope inspection',
    tailNumber: 'N67890',
    aircraftType: 'Airbus A320',
    aircraftId: '2',
    type: 'engine',
    status: 'scheduled',
    priority: 'medium',
    scheduledStart: '2024-12-29',
    scheduledEnd: '2024-12-29',
    assignedTo: ['John Smith'],
    estimatedHours: 8,
    location: 'Hangar B',
    partsRequired: [],
    complianceItems: [],
    notes: '',
    createdBy: 'admin',
    createdAt: '2024-12-21',
    updatedAt: '2024-12-21',
  },
  {
    id: '3',
    title: 'Landing Gear Overhaul',
    description: 'Complete overhaul of landing gear',
    tailNumber: 'N24680',
    aircraftType: 'Embraer E175',
    aircraftId: '3',
    type: 'component',
    status: 'scheduled',
    priority: 'critical',
    scheduledStart: '2024-12-28',
    scheduledEnd: '2024-12-31',
    assignedTo: ['Mike Johnson', 'Tom Wilson'],
    estimatedHours: 72,
    location: 'Hangar A',
    partsRequired: [],
    complianceItems: [],
    notes: '',
    createdBy: 'admin',
    createdAt: '2024-12-22',
    updatedAt: '2024-12-22',
  },
  {
    id: '4',
    title: 'A-Check Service',
    description: 'Routine A-Check',
    tailNumber: 'N11111',
    aircraftType: 'Boeing 777-300',
    aircraftId: '4',
    type: 'a_check',
    status: 'completed',
    priority: 'low',
    scheduledStart: '2024-12-27',
    scheduledEnd: '2024-12-27',
    assignedTo: ['Sarah Chen'],
    estimatedHours: 6,
    location: 'Line Maintenance',
    partsRequired: [],
    complianceItems: [],
    notes: '',
    createdBy: 'admin',
    createdAt: '2024-12-23',
    updatedAt: '2024-12-27',
  },
  {
    id: '5',
    title: 'APU Replacement',
    description: 'Replace auxiliary power unit',
    tailNumber: 'N22222',
    aircraftType: 'Airbus A321',
    aircraftId: '5',
    type: 'component',
    status: 'scheduled',
    priority: 'high',
    scheduledStart: '2024-12-30',
    scheduledEnd: '2025-01-02',
    assignedTo: ['John Smith', 'Tom Wilson'],
    estimatedHours: 36,
    location: 'Hangar C',
    partsRequired: [],
    complianceItems: [],
    notes: '',
    createdBy: 'admin',
    createdAt: '2024-12-24',
    updatedAt: '2024-12-24',
  },
]

// Sortable Task Card Component
function SortableTaskCard({ task }: { task: MaintenanceTask }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCard task={task} dragHandleProps={listeners} />
    </div>
  )
}

// Task Card Component
function TaskCard({
  task,
  dragHandleProps,
  isOverlay,
}: {
  task: MaintenanceTask
  dragHandleProps?: Record<string, unknown>
  isOverlay?: boolean
}) {
  return (
    <Card className={`mb-3 ${isOverlay ? 'shadow-lg ring-2 ring-primary' : 'hover:shadow-md'} transition-shadow`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <button
            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm truncate">{task.title}</h4>
              <TaskPriorityBadge priority={task.priority} />
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Plane className="h-3 w-3" />
              <span className="font-mono">{task.tailNumber}</span>
            </div>

            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{task.estimatedHours}h</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{task.assignedTo.length}</span>
              </div>
            </div>

            {task.assignedTo.length > 0 && (
              <div className="flex -space-x-2 mt-2">
                {task.assignedTo.slice(0, 3).map((name, i) => (
                  <div
                    key={i}
                    className="h-6 w-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-medium"
                    title={name}
                  >
                    {name.split(' ').map((n) => n[0]).join('')}
                  </div>
                ))}
                {task.assignedTo.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium">
                    +{task.assignedTo.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Column Component
function KanbanColumn({
  column,
  tasks,
}: {
  column: typeof columns[0]
  tasks: MaintenanceTask[]
}) {
  return (
    <div className="flex-1 min-w-[300px] max-w-[350px]">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <CardTitle className="text-base">{column.title}</CardTitle>
            </div>
            <Badge variant="secondary">{tasks.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="min-h-[400px]">
            <SortableContext
              items={tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {tasks.map((task) => (
                <SortableTaskCard key={task.id} task={task} />
              ))}
            </SortableContext>
            {tasks.length === 0 && (
              <div className="h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                Drop tasks here
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Transform API task to kanban MaintenanceTask
function transformTaskForKanban(task: ApiTask, aircraft?: ApiAircraft): MaintenanceTask {
  const typeMap: Record<string, MaintenanceTask['type']> = {
    inspection: 'a_check',
    repair: 'component',
    overhaul: 'c_check',
  }
  return {
    id: task.id,
    title: `${task.type.charAt(0).toUpperCase() + task.type.slice(1)} Task`,
    description: task.notes || 'No description',
    tailNumber: aircraft?.tail_number || 'Unknown',
    aircraftType: aircraft?.model || 'Unknown',
    aircraftId: task.aircraft_id,
    type: typeMap[task.type] || 'component',
    status: task.state as TaskStatus,
    priority: 'medium',
    scheduledStart: task.start_time.split('T')[0],
    scheduledEnd: task.end_time.split('T')[0],
    assignedTo: task.assigned_mechanic_id ? ['Assigned'] : [],
    estimatedHours: Math.round((new Date(task.end_time).getTime() - new Date(task.start_time).getTime()) / (1000 * 60 * 60)),
    location: 'Hangar',
    partsRequired: [],
    complianceItems: [],
    notes: task.notes || '',
    createdBy: 'system',
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  }
}

export function KanbanBoard() {
  const [activeTask, setActiveTask] = useState<MaintenanceTask | null>(null)
  const [localTasks, setLocalTasks] = useState<MaintenanceTask[]>(mockTasks)

  const { orgId, isAuthenticated } = useAppSelector((state) => state.auth)
  const isDemo = !isAuthenticated || !orgId

  // RTK Query hooks
  const { data: apiTasks, isLoading: apiLoading, refetch: apiRefetch } = useGetTasksQuery(
    {},
    { skip: isDemo }
  )
  const { data: apiAircraft } = useGetAircraftListQuery({}, { skip: isDemo })
  const [transitionTaskState] = useTransitionTaskStateMutation()

  const isLoading = isDemo ? false : apiLoading
  const usingMockData = isDemo

  // Transform API data or use mock data
  const tasks: MaintenanceTask[] = isDemo
    ? localTasks
    : (apiTasks || []).map((task) => {
        const aircraft = apiAircraft?.find((a) => a.id === task.aircraft_id)
        return transformTaskForKanban(task, aircraft)
      })

  const refetch = isDemo ? () => {} : apiRefetch

  // Group tasks by status (only show main workflow columns)
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, MaintenanceTask[]> = {
      scheduled: [],
      in_progress: [],
      completed: [],
    }
    tasks.forEach((task: MaintenanceTask) => {
      // Only include tasks with statuses that have columns
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    })
    return grouped
  }, [tasks])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t: MaintenanceTask) => t.id === event.active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeTask = tasks.find((t: MaintenanceTask) => t.id === active.id)
    if (!activeTask) return

    // Check if dropping over a column
    const overColumn = columns.find((c) => c.id === over.id)
    if (overColumn && activeTask.status !== overColumn.id) {
      // Update local state immediately for responsiveness (demo mode only)
      if (isDemo) {
        setLocalTasks((prev: MaintenanceTask[]) =>
          prev.map((t: MaintenanceTask) =>
            t.id === activeTask.id ? { ...t, status: overColumn.id as TaskStatus } : t
          )
        )
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeTask = tasks.find((t: MaintenanceTask) => t.id === active.id)
    if (!activeTask) return

    // Determine the target status
    let targetStatus: TaskStatus | null = null

    // Check if dropped on a column
    const overColumn = columns.find((c) => c.id === over.id)
    if (overColumn) {
      targetStatus = overColumn.id
    } else {
      // Check if dropped on another task
      const overTask = tasks.find((t: MaintenanceTask) => t.id === over.id)
      if (overTask) {
        targetStatus = overTask.status
      }
    }

    if (targetStatus && activeTask.status !== targetStatus) {
      const statusLabels: Record<string, string> = {
        scheduled: 'Scheduled',
        in_progress: 'In Progress',
        completed: 'Completed',
      }

      if (isDemo) {
        // Update local state for demo mode
        setLocalTasks((prev: MaintenanceTask[]) =>
          prev.map((t: MaintenanceTask) =>
            t.id === activeTask.id ? { ...t, status: targetStatus! } : t
          )
        )
        toast.success(`Task moved to ${statusLabels[targetStatus]}`)
      } else {
        // Call API to transition task state
        try {
          await transitionTaskState({
            id: activeTask.id,
            data: { new_state: targetStatus as ApiTaskState },
          }).unwrap()
          toast.success(`Task moved to ${statusLabels[targetStatus]}`)
        } catch {
          toast.error('Failed to update task status')
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-muted-foreground">
            Drag and drop tasks between columns
            {usingMockData && (
              <span className="ml-2 text-xs text-maintenance">(Demo Data)</span>
            )}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((col) => (
          <Card key={col.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${col.color}`} />
                  <span className="font-medium">{col.title}</span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <span className="text-2xl font-bold">
                    {tasksByStatus[col.id]?.length || 0}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <div key={col.id} className="flex-1 min-w-[300px] max-w-[350px]">
              <Card className="h-[500px]">
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasksByStatus[column.id] || []}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} isOverlay />}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
