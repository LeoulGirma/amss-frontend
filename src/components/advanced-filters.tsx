import { useState, useEffect } from 'react'
import { Filter, Save, Trash2, Star, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface FilterField {
  id: string
  label: string
  type: 'text' | 'select' | 'date' | 'dateRange' | 'multiSelect'
  options?: { value: string; label: string }[]
  placeholder?: string
}

export interface FilterValue {
  field: string
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'between' | 'in'
  value: string | string[]
}

export interface SavedView {
  id: string
  name: string
  filters: FilterValue[]
  isDefault: boolean
  createdAt: string
}

interface AdvancedFiltersProps {
  fields: FilterField[]
  filters: FilterValue[]
  onFiltersChange: (filters: FilterValue[]) => void
  storageKey: string
  presets?: { name: string; filters: FilterValue[] }[]
}

export function AdvancedFilters({
  fields,
  filters,
  onFiltersChange,
  storageKey,
  presets = [],
}: AdvancedFiltersProps) {
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [viewName, setViewName] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  // Load saved views from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`${storageKey}_views`)
    if (stored) {
      try {
        setSavedViews(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse saved views', e)
      }
    }
  }, [storageKey])

  // Save views to localStorage
  const persistViews = (views: SavedView[]) => {
    localStorage.setItem(`${storageKey}_views`, JSON.stringify(views))
    setSavedViews(views)
  }

  const addFilter = () => {
    const newFilter: FilterValue = {
      field: fields[0].id,
      operator: 'contains',
      value: '',
    }
    onFiltersChange([...filters, newFilter])
  }

  const updateFilter = (index: number, updates: Partial<FilterValue>) => {
    const newFilters = [...filters]
    newFilters[index] = { ...newFilters[index], ...updates }
    onFiltersChange(newFilters)
  }

  const removeFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index))
  }

  const clearAllFilters = () => {
    onFiltersChange([])
  }

  const saveCurrentView = () => {
    if (!viewName.trim()) {
      toast.error('Please enter a view name')
      return
    }

    const newView: SavedView = {
      id: Date.now().toString(),
      name: viewName.trim(),
      filters: [...filters],
      isDefault: savedViews.length === 0,
      createdAt: new Date().toISOString(),
    }

    persistViews([...savedViews, newView])
    setViewName('')
    setSaveDialogOpen(false)
    toast.success(`View "${newView.name}" saved`)
  }

  const loadView = (view: SavedView) => {
    onFiltersChange([...view.filters])
    setIsOpen(false)
    toast.success(`Loaded view "${view.name}"`)
  }

  const deleteView = (viewId: string) => {
    const view = savedViews.find((v) => v.id === viewId)
    persistViews(savedViews.filter((v) => v.id !== viewId))
    toast.success(`Deleted view "${view?.name}"`)
  }

  const setDefaultView = (viewId: string) => {
    const updated = savedViews.map((v) => ({
      ...v,
      isDefault: v.id === viewId,
    }))
    persistViews(updated)
    toast.success('Default view updated')
  }

  const applyPreset = (preset: { name: string; filters: FilterValue[] }) => {
    onFiltersChange([...preset.filters])
    setIsOpen(false)
    toast.success(`Applied "${preset.name}" preset`)
  }

  const getFieldLabel = (fieldId: string) => {
    return fields.find((f) => f.id === fieldId)?.label || fieldId
  }

  const activeFilterCount = filters.filter((f) => f.value && (Array.isArray(f.value) ? f.value.length > 0 : f.value.length > 0)).length

  return (
    <div className="flex items-center gap-2">
      {/* Quick filter badges */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {filters.slice(0, 3).map((filter, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              {getFieldLabel(filter.field)}: {Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}
              <button onClick={() => removeFilter(index)} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.length > 3 && (
            <Badge variant="outline">+{filters.length - 3} more</Badge>
          )}
        </div>
      )}

      {/* Filter sheet trigger */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Advanced Filters</SheetTitle>
            <SheetDescription>
              Create complex filters and save them as views
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Presets */}
            {presets.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Quick Presets</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {presets.map((preset, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Saved Views */}
            {savedViews.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Saved Views</Label>
                <ScrollArea className="h-32 mt-2">
                  <div className="space-y-2">
                    {savedViews.map((view) => (
                      <div
                        key={view.id}
                        className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50"
                      >
                        <button
                          className="flex items-center gap-2 text-sm flex-1 text-left"
                          onClick={() => loadView(view)}
                        >
                          {view.isDefault && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                          {view.name}
                          <Badge variant="outline" className="ml-2">
                            {view.filters.length} filters
                          </Badge>
                        </button>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setDefaultView(view.id)}
                          >
                            <Star className={`h-3 w-3 ${view.isDefault ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => deleteView(view.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <Separator />

            {/* Active Filters */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Active Filters</Label>
                <Button variant="ghost" size="sm" onClick={addFilter}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Filter
                </Button>
              </div>

              <div className="space-y-3 mt-3">
                {filters.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No filters applied. Click "Add Filter" to start.
                  </p>
                ) : (
                  filters.map((filter, index) => (
                    <div key={index} className="flex items-end gap-2 p-3 rounded-md border bg-muted/30">
                      <div className="flex-1">
                        <Label className="text-xs">Field</Label>
                        <Select
                          value={filter.field}
                          onValueChange={(value) => updateFilter(index, { field: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fields.map((field) => (
                              <SelectItem key={field.id} value={field.id}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-28">
                        <Label className="text-xs">Operator</Label>
                        <Select
                          value={filter.operator}
                          onValueChange={(value) => updateFilter(index, { operator: value as FilterValue['operator'] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="gt">Greater than</SelectItem>
                            <SelectItem value="lt">Less than</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex-1">
                        <Label className="text-xs">Value</Label>
                        <Input
                          value={Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}
                          onChange={(e) => updateFilter(index, { value: e.target.value })}
                          placeholder="Enter value..."
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive shrink-0"
                        onClick={() => removeFilter(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <SheetFooter className="mt-6 gap-2">
            <Button variant="outline" onClick={clearAllFilters} disabled={filters.length === 0}>
              Clear All
            </Button>
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={filters.length === 0}>
                  <Save className="h-4 w-4 mr-2" />
                  Save View
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Filter View</DialogTitle>
                  <DialogDescription>
                    Save your current filters as a reusable view
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="viewName">View Name</Label>
                  <Input
                    id="viewName"
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value)}
                    placeholder="e.g., High Priority Tasks"
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveCurrentView}>Save View</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={() => setIsOpen(false)}>Apply Filters</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
