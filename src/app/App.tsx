import { Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AircraftStatusBadge } from '@/components/aircraft-status-badge'

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Plane className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">AMSS</h1>
          </div>
          <p className="text-muted-foreground">
            Aircraft Maintenance Scheduling System
          </p>
        </div>

        {/* Aircraft Status Badges Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Aircraft Status Badges</CardTitle>
            <CardDescription>AMSS status indicators with aviation-specific colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <AircraftStatusBadge status="operational" />
              <AircraftStatusBadge status="maintenance" />
              <AircraftStatusBadge status="grounded" />
            </div>
            <div className="flex flex-wrap gap-3">
              <AircraftStatusBadge status="operational" size="lg" />
              <AircraftStatusBadge status="maintenance" size="lg" pulse />
              <AircraftStatusBadge status="grounded" size="lg" />
            </div>
          </CardContent>
        </Card>

        {/* Sample Aircraft Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-mono">N12345</CardTitle>
                <AircraftStatusBadge status="operational" />
              </div>
              <CardDescription>Boeing 737-800</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Next maintenance: 45 flight hours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-mono">N67890</CardTitle>
                <AircraftStatusBadge status="maintenance" pulse />
              </div>
              <CardDescription>Airbus A320</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                C-Check in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-mono">N24680</CardTitle>
                <AircraftStatusBadge status="grounded" />
              </div>
              <CardDescription>Embraer E175</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AOG - Awaiting parts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Buttons Demo */}
        <Card>
          <CardHeader>
            <CardTitle>UI Components</CardTitle>
            <CardDescription>shadcn/ui button variants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-2 justify-center text-sm">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full">React 19</span>
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full">TypeScript</span>
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full">Vite</span>
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full">Tailwind CSS</span>
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full">shadcn/ui</span>
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full">Redux Toolkit</span>
        </div>
      </div>
    </div>
  )
}

export default App
