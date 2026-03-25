import { useState } from 'react'
import { useDiagramStorage } from '../hooks/useDiagramStorage'

export default function SaveLoadPanel({ nodes, edges, diagramType, onLoad }) {
  const [showPanel, setShowPanel] = useState(false)
  const [diagramName, setDiagramName] = useState('Untitled Diagram')
  const { saveDiagram, loadDiagram, getDiagrams, deleteDiagram, createNewDiagram } =
    useDiagramStorage()

  const diagrams = getDiagrams()

  const handleSave = () => {
    if (!diagramName.trim()) {
      alert('Please enter a diagram name')
      return
    }
    const id = createNewDiagram()
    saveDiagram(id, diagramName, nodes, edges, diagramType)
    alert(`Diagram saved as "${diagramName}"`)
    setShowPanel(false)
    setDiagramName('Untitled Diagram')
  }

  const handleLoad = (diagram) => {
    onLoad(diagram)
    setShowPanel(false)
  }

  const handleDelete = (id, name) => {
    if (confirm(`Delete "${name}"?`)) {
      deleteDiagram(id)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
        </svg>
        Save/Load
      </button>

      {showPanel && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
          {/* Save Section */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Save Diagram</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={diagramName}
                onChange={(e) => setDiagramName(e.target.value)}
                placeholder="Diagram name..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={handleSave}
                className="px-3 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          {/* Load Section */}
          {diagrams.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Recent Diagrams</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {diagrams.map((diagram) => (
                  <div
                    key={diagram.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <button
                      onClick={() => handleLoad(diagram)}
                      className="flex-1 text-left text-sm"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">{diagram.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(diagram.savedAt).toLocaleDateString()}
                      </div>
                    </button>
                    <button
                      onClick={() => handleDelete(diagram.id, diagram.name)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
