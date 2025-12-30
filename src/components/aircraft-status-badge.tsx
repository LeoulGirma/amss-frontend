import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      status: {
        operational: "bg-operational-light text-operational-dark",
        maintenance: "bg-maintenance-light text-maintenance-dark",
        grounded: "bg-grounded-light text-grounded-dark",
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        default: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1",
      },
      pulse: {
        true: "animate-pulse-status",
        false: "",
      },
    },
    defaultVariants: {
      status: "operational",
      size: "default",
      pulse: false,
    },
  }
)

export interface AircraftStatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  showDot?: boolean
}

const statusLabels = {
  operational: "Operational",
  maintenance: "In Maintenance",
  grounded: "Grounded",
}

const statusDotColors = {
  operational: "bg-operational",
  maintenance: "bg-maintenance",
  grounded: "bg-grounded",
}

export function AircraftStatusBadge({
  className,
  status,
  size,
  pulse,
  showDot = true,
  children,
  ...props
}: AircraftStatusBadgeProps) {
  const statusKey = status ?? "operational"

  return (
    <span
      className={cn(statusBadgeVariants({ status, size, pulse }), className)}
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
