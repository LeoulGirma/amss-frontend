import { useState, useEffect } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type {
  ApiAircraft,
  ApiAircraftStatus,
  AircraftCreateRequest,
  AircraftUpdateRequest,
} from '@/lib/api'

interface AircraftFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  aircraft?: ApiAircraft | null
  onSubmit: (data: AircraftCreateRequest | AircraftUpdateRequest) => Promise<void>
  onDelete?: () => Promise<void>
  isLoading?: boolean
}

const aircraftModels = [
  'Boeing 737-800',
  'Boeing 737 MAX 8',
  'Boeing 777-300',
  'Boeing 787-9',
  'Airbus A320',
  'Airbus A321',
  'Airbus A350-900',
  'Embraer E175',
  'Embraer E190',
  'Bombardier CRJ-900',
  'Cessna Citation X',
  'Gulfstream G650',
]

export function AircraftForm({
  open,
  onOpenChange,
  aircraft,
  onSubmit,
  onDelete,
  isLoading = false,
}: AircraftFormProps) {
  const [formData, setFormData] = useState({
    tail_number: '',
    model: '',
    status: 'operational' as ApiAircraftStatus,
    capacity_slots: 4,
    flight_hours_total: 0,
    cycles_total: 0,
  })

  const isEditing = !!aircraft

  useEffect(() => {
    if (aircraft) {
      setFormData({
        tail_number: aircraft.tail_number,
        model: aircraft.model,
        status: aircraft.status,
        capacity_slots: aircraft.capacity_slots,
        flight_hours_total: aircraft.flight_hours_total || 0,
        cycles_total: aircraft.cycles_total || 0,
      })
    } else {
      setFormData({
        tail_number: '',
        model: '',
        status: 'operational',
        capacity_slots: 4,
        flight_hours_total: 0,
        cycles_total: 0,
      })
    }
  }, [aircraft, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Aircraft' : 'Add Aircraft'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Update aircraft information'
              : 'Add a new aircraft to your fleet'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tail_number">Tail Number *</Label>
              <Input
                id="tail_number"
                placeholder="N12345"
                value={formData.tail_number}
                onChange={(e) =>
                  setFormData({ ...formData, tail_number: e.target.value.toUpperCase() })
                }
                required
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Aircraft Model *</Label>
              <Select
                value={formData.model}
                onValueChange={(value) => setFormData({ ...formData, model: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select aircraft model" />
                </SelectTrigger>
                <SelectContent>
                  {aircraftModels.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Or type a custom model name
              </p>
              <Input
                placeholder="Custom model name"
                value={aircraftModels.includes(formData.model) ? '' : formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as ApiAircraftStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="maintenance">In Maintenance</SelectItem>
                  <SelectItem value="grounded">Grounded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity_slots">Maintenance Capacity Slots *</Label>
              <Input
                id="capacity_slots"
                type="number"
                min="1"
                max="10"
                value={formData.capacity_slots}
                onChange={(e) =>
                  setFormData({ ...formData, capacity_slots: parseInt(e.target.value) || 1 })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Number of concurrent maintenance tasks allowed
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flight_hours_total">Total Flight Hours</Label>
                <Input
                  id="flight_hours_total"
                  type="number"
                  min="0"
                  value={formData.flight_hours_total}
                  onChange={(e) =>
                    setFormData({ ...formData, flight_hours_total: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cycles_total">Total Cycles</Label>
                <Input
                  id="cycles_total"
                  type="number"
                  min="0"
                  value={formData.cycles_total}
                  onChange={(e) =>
                    setFormData({ ...formData, cycles_total: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {isEditing && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Aircraft</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {aircraft?.tail_number}? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
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
                'Update Aircraft'
              ) : (
                'Add Aircraft'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
