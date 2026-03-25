import { useState } from 'react'
import { exportPNG, exportPDF } from '../utils/exportDiagram'

export default function ExportButtons() {
  const [exporting, setExporting] = useState(null)

  async function handleExport(type) {
    setExporting(type)
    try {
      if (type === 'png') await exportPNG()
      else await exportPDF()
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleExport('png')}
        disabled={!!exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        {exporting === 'png' ? (
          <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        Export PNG
      </button>
      <button
        onClick={() => handleExport('pdf')}
        disabled={!!exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        {exporting === 'pdf' ? (
          <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )}
        Export PDF
      </button>
    </div>
  )
}
