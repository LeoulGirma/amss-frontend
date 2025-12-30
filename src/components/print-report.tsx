import { useRef, forwardRef, type ReactNode } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface PrintableReportProps {
  title: string
  children: ReactNode
}

// Printable content wrapper
export const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(
  ({ title, children }, ref) => {
    return (
      <div ref={ref} className="p-8 bg-white text-black print:p-0">
        <div className="mb-6 pb-4 border-b-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Generated on {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">AMSS</div>
              <div className="text-xs text-gray-500">Aircraft Maintenance Scheduling System</div>
            </div>
          </div>
        </div>
        {children}
        <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center print:fixed print:bottom-4 print:left-0 print:right-0">
          Confidential - AMSS Generated Report - Page 1 of 1
        </div>
      </div>
    )
  }
)
PrintableReport.displayName = 'PrintableReport'

// Print button component with preview
interface PrintButtonProps {
  title: string
  children: ReactNode
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function PrintButton({ title, children, variant = 'outline', size = 'default' }: PrintButtonProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: title,
  })

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Printer className="mr-2 h-4 w-4" />
          Print Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Print Preview</DialogTitle>
          <DialogDescription>
            Review the report before printing
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end mb-4">
          <Button onClick={() => handlePrint()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <PrintableReport ref={printRef} title={title}>
            {children}
          </PrintableReport>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Fleet Status Report Content
export function FleetStatusReportContent() {
  const aircraft = [
    { tailNumber: 'N12345', type: 'Boeing 737-800', status: 'Operational', location: 'JFK', hours: 12450 },
    { tailNumber: 'N67890', type: 'Airbus A320', status: 'Maintenance', location: 'LAX', hours: 8920 },
    { tailNumber: 'N11111', type: 'Boeing 777-300', status: 'Operational', location: 'ORD', hours: 15680 },
    { tailNumber: 'N22222', type: 'Airbus A321', status: 'Operational', location: 'DFW', hours: 6340 },
    { tailNumber: 'N33333', type: 'Embraer E175', status: 'Grounded', location: 'MIA', hours: 4210 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded">
          <div className="text-2xl font-bold">24</div>
          <div className="text-sm text-gray-500">Total Aircraft</div>
        </div>
        <div className="p-4 bg-green-50 rounded">
          <div className="text-2xl font-bold text-green-600">18</div>
          <div className="text-sm text-gray-500">Operational</div>
        </div>
        <div className="p-4 bg-yellow-50 rounded">
          <div className="text-2xl font-bold text-yellow-600">4</div>
          <div className="text-sm text-gray-500">In Maintenance</div>
        </div>
        <div className="p-4 bg-red-50 rounded">
          <div className="text-2xl font-bold text-red-600">2</div>
          <div className="text-sm text-gray-500">Grounded</div>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Tail Number</th>
            <th className="border p-2 text-left">Aircraft Type</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Location</th>
            <th className="border p-2 text-right">Flight Hours</th>
          </tr>
        </thead>
        <tbody>
          {aircraft.map((ac) => (
            <tr key={ac.tailNumber}>
              <td className="border p-2 font-mono">{ac.tailNumber}</td>
              <td className="border p-2">{ac.type}</td>
              <td className="border p-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  ac.status === 'Operational' ? 'bg-green-100 text-green-800' :
                  ac.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {ac.status}
                </span>
              </td>
              <td className="border p-2">{ac.location}</td>
              <td className="border p-2 text-right">{ac.hours.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Maintenance Report Content
export function MaintenanceReportContent() {
  const tasks = [
    { id: 'T001', aircraft: 'N12345', type: 'C-Check', status: 'In Progress', due: '2024-12-30', assigned: 'Mike Johnson' },
    { id: 'T002', aircraft: 'N67890', type: 'Engine Inspection', status: 'Scheduled', due: '2025-01-02', assigned: 'Sarah Chen' },
    { id: 'T003', aircraft: 'N11111', type: 'Landing Gear', status: 'Completed', due: '2024-12-25', assigned: 'John Smith' },
    { id: 'T004', aircraft: 'N22222', type: 'APU Replacement', status: 'Scheduled', due: '2025-01-05', assigned: 'Tom Wilson' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded">
          <div className="text-2xl font-bold text-blue-600">12</div>
          <div className="text-sm text-gray-500">Total Tasks</div>
        </div>
        <div className="p-4 bg-yellow-50 rounded">
          <div className="text-2xl font-bold text-yellow-600">4</div>
          <div className="text-sm text-gray-500">In Progress</div>
        </div>
        <div className="p-4 bg-green-50 rounded">
          <div className="text-2xl font-bold text-green-600">8</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Task ID</th>
            <th className="border p-2 text-left">Aircraft</th>
            <th className="border p-2 text-left">Type</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Due Date</th>
            <th className="border p-2 text-left">Assigned To</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td className="border p-2 font-mono">{task.id}</td>
              <td className="border p-2 font-mono">{task.aircraft}</td>
              <td className="border p-2">{task.type}</td>
              <td className="border p-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                  task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {task.status}
                </span>
              </td>
              <td className="border p-2">{task.due}</td>
              <td className="border p-2">{task.assigned}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Compliance Report Content
export function ComplianceReportContent() {
  const items = [
    { id: 'AD-2024-15-06', type: 'AD', aircraft: 'N12345', status: 'Compliant', dueDate: '2025-01-15' },
    { id: 'SB-737-32-1089', type: 'SB', aircraft: 'N12345', status: 'Pending', dueDate: '2025-02-01' },
    { id: 'AD-2024-12-04', type: 'AD', aircraft: 'N67890', status: 'Compliant', dueDate: '2025-03-20' },
    { id: 'SB-A320-27-1234', type: 'SB', aircraft: 'N67890', status: 'Overdue', dueDate: '2024-12-15' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-green-50 rounded">
          <div className="text-2xl font-bold text-green-600">24</div>
          <div className="text-sm text-gray-500">Compliant</div>
        </div>
        <div className="p-4 bg-yellow-50 rounded">
          <div className="text-2xl font-bold text-yellow-600">3</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="p-4 bg-red-50 rounded">
          <div className="text-2xl font-bold text-red-600">1</div>
          <div className="text-sm text-gray-500">Overdue</div>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Reference</th>
            <th className="border p-2 text-left">Type</th>
            <th className="border p-2 text-left">Aircraft</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Due Date</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="border p-2 font-mono">{item.id}</td>
              <td className="border p-2">{item.type}</td>
              <td className="border p-2 font-mono">{item.aircraft}</td>
              <td className="border p-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  item.status === 'Compliant' ? 'bg-green-100 text-green-800' :
                  item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.status}
                </span>
              </td>
              <td className="border p-2">{item.dueDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
