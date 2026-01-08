import { format } from 'date-fns'

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends object>(
  data: T[],
  filename: string,
  columns: { key: keyof T; header: string; format?: (value: unknown) => string }[]
) {
  if (data.length === 0) {
    return
  }

  // Create header row
  const headers = columns.map((col) => col.header)

  // Create data rows
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = item[col.key]
      const formatted = col.format ? col.format(value) : String(value ?? '')
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (formatted.includes(',') || formatted.includes('"') || formatted.includes('\n')) {
        return `"${formatted.replace(/"/g, '""')}"`
      }
      return formatted
    })
  )

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

  // Download file
  downloadFile(csvContent, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv')
}

/**
 * Export data to JSON file
 */
export function exportToJSON<T extends object>(data: T[], filename: string) {
  const jsonContent = JSON.stringify(data, null, 2)
  downloadFile(jsonContent, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.json`, 'application/json')
}

/**
 * Generate and download a PDF report using browser print
 */
export function printReport(
  title: string,
  content: string,
  options?: {
    styles?: string
    orientation?: 'portrait' | 'landscape'
  }
) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print reports')
    return
  }

  const styles = options?.styles || ''
  const orientation = options?.orientation || 'portrait'

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @page {
          size: ${orientation};
          margin: 1in;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #1a1a1a;
          max-width: 100%;
          padding: 0;
          margin: 0;
        }
        .report-header {
          text-align: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e5e5e5;
        }
        .report-header h1 {
          font-size: 24px;
          margin: 0 0 8px 0;
        }
        .report-header .date {
          color: #666;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f5f5f5;
          font-weight: 600;
        }
        tr:nth-child(even) {
          background-color: #fafafa;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin: 16px 0;
        }
        .stat-card {
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          text-align: center;
        }
        .stat-card .value {
          font-size: 24px;
          font-weight: bold;
        }
        .stat-card .label {
          color: #666;
          font-size: 12px;
        }
        .section {
          margin: 24px 0;
        }
        .section h2 {
          font-size: 16px;
          margin: 0 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
        }
        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }
        .status-operational { background: #dcfce7; color: #166534; }
        .status-maintenance { background: #fef3c7; color: #92400e; }
        .status-grounded { background: #fee2e2; color: #991b1b; }
        .status-scheduled { background: #dbeafe; color: #1e40af; }
        .status-in_progress { background: #fef3c7; color: #92400e; }
        .status-completed { background: #dcfce7; color: #166534; }
        .status-cancelled { background: #e5e5e5; color: #525252; }
        ${styles}
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1>${title}</h1>
        <div class="date">Generated on ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}</div>
      </div>
      ${content}
    </body>
    </html>
  `)
  printWindow.document.close()

  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.focus()
    printWindow.print()
  }
}

/**
 * Helper to download a file
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Format date for export
 */
export function formatDateForExport(date: string | null | undefined): string {
  if (!date) return ''
  try {
    return format(new Date(date), 'yyyy-MM-dd HH:mm:ss')
  } catch {
    return date
  }
}

/**
 * Format date short for export
 */
export function formatDateShort(date: string | null | undefined): string {
  if (!date) return ''
  try {
    return format(new Date(date), 'MMM d, yyyy')
  } catch {
    return date
  }
}
