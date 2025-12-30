import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const taskStatusVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      status: {
        scheduled: "bg-scheduled-light text-scheduled-dark",
        in_progress: "bg-in-progress-light text-in-progress-dark",
        completed: "bg-completed-light text-completed-dark",
        cancelled: "bg-cancelled-light text-cancelled-dark",
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        default: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      status: "scheduled",
      size: "default",
    },
  }
)

const priorityVariants = cva(
  "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      priority: {
        low: "bg-muted text-muted-foreground",
        medium: "bg-scheduled-light text-scheduled-dark",
        high: "bg-maintenance-light text-maintenance-dark",
        critical: "bg-grounded-light text-grounded-dark",
      },
    },
    defaultVariants: {
      priority: "medium",
    },
  }
)

export interface TaskStatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof taskStatusVariants> {
  showDot?: boolean
}

export interface TaskPriorityBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof priorityVariants> {}

const statusLabels = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
}

const statusDotColors = {
  scheduled: "bg-scheduled",
  in_progress: "bg-in-progress",
  completed: "bg-completed",
  cancelled: "bg-cancelled",
}

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
}

export function TaskStatusBadge({
  className,
  status,
  size,
  showDot = true,
  children,
  ...props
}: TaskStatusBadgeProps) {
  const statusKey = status ?? "scheduled"

  return (
    <span
      className={cn(taskStatusVariants({ status, size }), className)}
      {...props}
    >
      {showDot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            statusDotColors[statusKey]
          )}
        />
      )}
      {children ?? statusLabels[statusKey]}
    </span>
  )
}

export function TaskPriorityBadge({
  className,
  priority,
  children,
  ...props
}: TaskPriorityBadgeProps) {
  const priorityKey = priority ?? "medium"

  return (
    <span
      className={cn(priorityVariants({ priority }), className)}
      {...props}
    >
      {children ?? priorityLabels[priorityKey]}
    </span>
  )
}
