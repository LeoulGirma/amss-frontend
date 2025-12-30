import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useGetAircraftListQuery } from '@/lib/api'
import { useAppSelector } from '@/app/store'

// Display task type matching maintenance-page.tsx
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

interface TaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: DisplayTask | null
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  isLoading?: boolean
}

const taskTypes = [
  { value: 'inspection', label: 'Inspection' },
  { value: 'repair', label: 'Repair' },
  { value: 'overhaul', label: 'Overhaul' },
]

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

export function TaskForm({ open, onOpenChange, task, onSubmit, isLoading = false }: TaskFormProps) {
  const { orgId } = useAppSelector((state) => state.auth)
  const isDemoMode = !orgId || orgId === 'demo-org'

  // Fetch aircraft from API
  const { data: apiAircraft } = useGetAircraftListQuery(
    { org_id: orgId || '' },
    { skip: isDemoMode }
  )

  // Map API aircraft to display format, or use mock for demo
  const aircraft = isDemoMode
    ? [
        { id: '1', tailNumber: 'N12345', type: 'Boeing 737-800' },
        { id: '2', tailNumber: 'N67890', type: 'Airbus A320' },
      ]
    : (apiAircraft || []).map(a => ({
        id: a.id,
        tailNumber: a.tail_number,
        type: a.model,
      }))
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    aircraftId: '',
    type: 'inspection',
    priority: 'medium',
    scheduledStart: '',
    scheduledEnd: '',
    estimatedHours: 8,
    notes: '',
  })

  const isEditing = !!task

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        aircraftId: task.aircraftId,
        type: task.type,
        priority: task.priority,
        scheduledStart: task.scheduledStart,
        scheduledEnd: task.scheduledEnd,
        estimatedHours: task.estimatedHours,
        notes: '',
      })
    } else {
      const today = new Date().toISOString().split('T')[0]
      setFormData({
        title: '',
        description: '',
        aircraftId: '',
        type: 'inspection',
        priority: 'medium',
        scheduledStart: today,
        scheduledEnd: today,
        estimatedHours: 8,
        notes: '',
      })
    }
  }, [task, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      aircraft_id: formData.aircraftId,
      type: formData.type,
      start_time: new Date(formData.scheduledStart).toISOString(),
      end_time: new Date(formData.scheduledEnd).toISOString(),
      notes: formData.description || formData.notes || formData.title,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Task' : 'Create Task'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Update maintenance task details'
              : 'Schedule a new maintenance task'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Engine Inspection"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the maintenance task..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aircraft">Aircraft *</Label>
              <Select
                value={formData.aircraftId}
                onValueChange={(value) =>
                  setFormData({ ...formData, aircraftId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select aircraft" />
                </SelectTrigger>
                <SelectContent>
                  {aircraft.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="font-mono">{a.tailNumber}</span>
                      <span className="text-muted-foreground ml-2">{a.type}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Task Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledStart">Start Date *</Label>
                <Input
                  id="scheduledStart"
                  type="date"
                  value={formData.scheduledStart}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledStart: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledEnd">End Date *</Label>
                <Input
                  id="scheduledEnd"
                  type="date"
                  value={formData.scheduledEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledEnd: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                min="1"
                value={formData.estimatedHours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedHours: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                'Update Task'
              ) : (
                'Create Task'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
