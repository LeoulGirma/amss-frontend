import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { TaskStatusBadge, TaskPriorityBadge } from '@/components/task-status-badge'
import { MaintenanceCalendar } from './maintenance-calendar'
import { useAppSelector } from '@/app/store'
import { useGetTasksQuery, useGetAircraftListQuery } from '@/lib/api'
import type { MaintenanceTask, MaintenanceType } from '@/types'

// Mock data for when API is unavailable
const mockTasks: MaintenanceTask[] = [
  {
    id: '1',
    title: 'C-Check Inspection',
    description: 'Complete C-Check inspection including structural checks.',
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
    title: 'Engine Borescope Inspection',
    description: 'Perform borescope inspection on both engines.',
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
    description: 'Complete overhaul of main landing gear assembly.',
    tailNumber: 'N24680',
    aircraftType: 'Embraer E175',
    aircraftId: '3',
    type: 'component',
    status: 'scheduled',
    priority: 'critical',
    scheduledStart: '2025-01-02',
    scheduledEnd: '2025-01-05',
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
    description: 'Routine A-Check including fluid levels.',
    tailNumber: 'N11111',
    aircraftType: 'Boeing 777-300',
    aircraftId: '4',
    type: 'a_check',
    status: 'scheduled',
    priority: 'low',
    scheduledStart: '2025-01-10',
    scheduledEnd: '2025-01-10',
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
]

const typeLabels: Record<MaintenanceType, string> = {
  a_check: 'A-Check',
  b_check: 'B-Check',
  c_check: 'C-Check',
  d_check: 'D-Check',
  line: 'Line Maintenance',
  component: 'Component',
  engine: 'Engine',
}

// Map API task type to MaintenanceType
const typeMap: Record<string, MaintenanceType> = {
  inspection: 'a_check',
  repair: 'component',
  overhaul: 'engine',
}

export function CalendarPage() {
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null)

  const { orgId, isAuthenticated } = useAppSelector((state) => state.auth)
  const isDemo = !isAuthenticated || !orgId

  // RTK Query hooks
  const { data: apiTasks, isLoading, error, refetch, isFetching } = useGetTasksQuery(
    {},
    { skip: isDemo }
  )
  const { data: apiAircraft } = useGetAircraftListQuery({}, { skip: isDemo })

  // Transform API tasks to MaintenanceTask format
  const tasks: MaintenanceTask[] = isDemo
    ? mockTasks
    : (apiTasks || []).map(task => {
        const aircraft = apiAircraft?.find(a => a.id === task.aircraft_id)
        return {
          id: task.id,
          title: `${task.type.charAt(0).toUpperCase() + task.type.slice(1)} - ${aircraft?.tail_number || 'Unknown'}`,
          description: task.notes || 'No description',
          tailNumber: aircraft?.tail_number || 'Unknown',
          aircraftType: aircraft?.model || 'Unknown',
          aircraftId: task.aircraft_id,
          type: typeMap[task.type] || 'line',
          status: task.state === 'in_progress' ? 'in_progress' : task.state as 'scheduled' | 'completed' | 'cancelled',
          priority: 'medium',
          scheduledStart: task.start_time.split('T')[0],
          scheduledEnd: task.end_time.split('T')[0],
          assignedTo: task.assigned_mechanic_id ? ['Assigned Mechanic'] : [],
          estimatedHours: Math.round((new Date(task.end_time).getTime() - new Date(task.start_time).getTime()) / (1000 * 60 * 60)),
          location: 'Hangar',
          partsRequired: [],
          complianceItems: [],
          notes: task.notes || '',
          createdBy: 'system',
          createdAt: task.created_at,
          updatedAt: task.updated_at,
        }
      })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            View maintenance schedule
            {isDemo && (
              <span className="ml-2 text-xs text-amber-600">(Demo Data)</span>
            )}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isDemo || isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Error Alert */}
      {error && !isDemo && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load calendar tasks. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Calendar */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[500px] w-full" />
          </CardContent>
        </Card>
      ) : (
        <MaintenanceCalendar tasks={tasks} onTaskClick={setSelectedTask} />
      )}

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-2xl">
          {selectedTask && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl">{selectedTask.title}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {selectedTask.tailNumber} · {selectedTask.aircraftType}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    <TaskStatusBadge status={selectedTask.status} />
                    <TaskPriorityBadge priority={selectedTask.priority} />
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2 font-medium">{typeLabels[selectedTask.type]}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <span className="ml-2 font-medium">{selectedTask.location}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Scheduled:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedTask.scheduledStart).toLocaleDateString()} -
                      {new Date(selectedTask.scheduledEnd).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-2 font-medium">{selectedTask.estimatedHours} hours</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Assigned Team</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.assignedTo.map((name, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm"
                      >
                        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                          {name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        {name}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button variant="outline" onClick={() => setSelectedTask(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
