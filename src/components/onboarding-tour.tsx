import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Plane,
  Wrench,
  Calendar,
  Package,
  Users,
  ShieldCheck,
  Search,
  Bell,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface TourStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  target?: string // CSS selector for highlighting
  action?: () => void
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AMSS',
    description: 'Aircraft Maintenance Scheduling System helps you manage your fleet, maintenance tasks, and compliance requirements efficiently.',
    icon: <Plane className="h-8 w-8" />,
  },
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    description: 'Your dashboard shows fleet status, pending tasks, and recent activity at a glance. Monitor your entire operation from one place.',
    icon: <LayoutDashboard className="h-8 w-8" />,
  },
  {
    id: 'fleet',
    title: 'Fleet Management',
    description: 'View and manage all your aircraft. Track status, flight hours, and maintenance history for each tail number.',
    icon: <Plane className="h-8 w-8" />,
  },
  {
    id: 'maintenance',
    title: 'Maintenance Tasks',
    description: 'Create, assign, and track maintenance tasks. Use the Kanban board for visual workflow management.',
    icon: <Wrench className="h-8 w-8" />,
  },
  {
    id: 'calendar',
    title: 'Calendar View',
    description: 'See all scheduled maintenance in a calendar format. Plan ahead and avoid conflicts.',
    icon: <Calendar className="h-8 w-8" />,
  },
  {
    id: 'parts',
    title: 'Parts Inventory',
    description: 'Track parts inventory, set low-stock alerts, and manage reservations for upcoming maintenance.',
    icon: <Package className="h-8 w-8" />,
  },
  {
    id: 'team',
    title: 'Team Management',
    description: 'Manage your maintenance team, view certifications, and balance workloads across technicians.',
    icon: <Users className="h-8 w-8" />,
  },
  {
    id: 'compliance',
    title: 'Compliance Tracking',
    description: 'Stay on top of ADs, SBs, and inspections. Never miss a compliance deadline.',
    icon: <ShieldCheck className="h-8 w-8" />,
  },
  {
    id: 'search',
    title: 'Quick Search',
    description: 'Press Cmd+K (or Ctrl+K) to quickly search across aircraft, tasks, parts, and more.',
    icon: <Search className="h-8 w-8" />,
  },
  {
    id: 'notifications',
    title: 'Stay Informed',
    description: 'Receive real-time notifications for task assignments, due dates, and important alerts.',
    icon: <Bell className="h-8 w-8" />,
  },
  {
    id: 'complete',
    title: "You're All Set!",
    description: 'Start by exploring the dashboard or creating your first maintenance task. You can restart this tour from Settings anytime.',
    icon: <Check className="h-8 w-8" />,
  },
]

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem('onboarding-completed')
    if (!completed) {
      // Delay showing the tour slightly
      const timer = setTimeout(() => setIsOpen(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleComplete()
    }
  }, [currentStep])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const handleComplete = useCallback(() => {
    localStorage.setItem('onboarding-completed', 'true')
    setIsOpen(false)
  }, [])

  const handleSkip = useCallback(() => {
    localStorage.setItem('onboarding-completed', 'true')
    setIsOpen(false)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === 'Escape') {
        handleSkip()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleNext, handlePrev, handleSkip])

  if (!isOpen) return null

  const step = tourSteps[currentStep]
  const progress = ((currentStep + 1) / tourSteps.length) * 100

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />

      {/* Tour Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-in zoom-in-95 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              {step.icon}
            </div>
            <CardTitle className="text-xl">{step.title}</CardTitle>
            <CardDescription className="text-base mt-2">
              {step.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-2">
            <div className="flex items-center gap-2 mb-2">
              <Progress value={progress} className="h-2" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {currentStep + 1} / {tourSteps.length}
              </span>
            </div>

            {/* Step indicators */}
            <div className="flex justify-center gap-1 mt-4">
              {tourSteps.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    'h-2 w-2 rounded-full transition-colors',
                    index === currentStep
                      ? 'bg-primary'
                      : index < currentStep
                      ? 'bg-primary/50'
                      : 'bg-muted'
                  )}
                  onClick={() => setCurrentStep(index)}
                />
              ))}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between gap-2">
            <Button variant="ghost" onClick={handleSkip}>
              Skip Tour
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrev}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep === tourSteps.length - 1 ? (
                  'Get Started'
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}

// Hook to restart tour from settings
export function useOnboardingTour() {
  const restartTour = () => {
    localStorage.removeItem('onboarding-completed')
    window.location.reload()
  }

  return { restartTour }
}
