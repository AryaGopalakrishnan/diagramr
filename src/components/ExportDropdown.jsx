import { useState, useRef, useEffect } from 'react'
import { exportPNG, exportPDF } from '../utils/exportDiagram'
import { useDiagramStorage } from '../hooks/useDiagramStorage'

export default function ExportDropdown({ nodes, edges, diagramType, onLoad }) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(null)
  const [diagramName, setDiagramName] = useState('Untitled Diagram')
  const [showSaveInput, setShowSaveInput] = useState(false)
  const dropdownRef = useRef(null)

  const { saveDiagram, getDiagrams, deleteDiagram, createNewDiagram } = useDiagramStorage()
  const diagrams = getDiagrams()

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
        setShowSaveInput(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

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

  function handleSave() {
    if (!diagramName.trim()) return
    const id = createNewDiagram()
    saveDiagram(id, diagramName, nodes, edges, diagramType)
    setShowSaveInput(false)
    setDiagramName('Untitled Diagram')
    setOpen(false)
  }

  function handleLoad(diagram) {
    onLoad(diagram)
    setOpen(false)
  }

  function handleDelete(e, id, name) {
    e.stopPropagation()
    if (confirm(`Delete "${name}"?`)) {
      deleteDiagram(id)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Export section */}
          <div className="p-1">
            <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Export</p>
            <button
              onClick={() => handleExport('png')}
              disabled={!!exporting}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {exporting === 'png' ? (
                <span className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
              ) : (
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              Export as PNG
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={!!exporting}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {exporting === 'pdf' ? (
                <span className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
              ) : (
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
              Export as PDF
            </button>
          </div>

          {/* Save/Load section */}
          <div className="border-t border-gray-100 dark:border-gray-700 p-1">
            <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Diagrams</p>

            {!showSaveInput ? (
              <button
                onClick={() => setShowSaveInput(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save diagram
              </button>
            ) : (
              <div className="px-3 py-2 flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={diagramName}
                  onChange={(e) => setDiagramName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  placeholder="Diagram name..."
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={handleSave}
                  className="px-2 py-1 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded transition-colors"
                >
                  Save
                </button>
              </div>
            )}

            {diagrams.length > 0 && (
              <div className="max-h-48 overflow-y-auto mt-1">
                {diagrams.map((diagram) => (
                  <div
                    key={diagram.id}
                    className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group"
                  >
                    <button onClick={() => handleLoad(diagram)} className="flex-1 text-left min-w-0">
                      <div className="text-sm text-gray-700 dark:text-gray-200 truncate">{diagram.name}</div>
                      <div className="text-xs text-gray-400">{new Date(diagram.savedAt).toLocaleDateString()}</div>
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, diagram.id, diagram.name)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 p-1 transition-opacity flex-shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
