import { useState } from 'react'
import ExportDropdown from './ExportDropdown'
import DarkModeToggle from './DarkModeToggle'

function encodeShareHash(data) {
  const json = JSON.stringify(data)
  const bytes = new TextEncoder().encode(json)
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(binary)
}

export default function Header({
  hasNodes,
  nodes,
  edges,
  diagramType,
  onLoad,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onPresenterMode,
  diagramStyle,
  onToggleStyle,
}) {
  const [toast, setToast] = useState(false)

  function handleShare() {
    const hash = encodeShareHash({ nodes, edges, diagramType })
    window.location.hash = hash
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    setToast(true)
    setTimeout(() => setToast(false), 2000)
  }

  return (
    <>
      <header
        style={{ background: '#1e3a5f' }}
        className="flex items-center justify-between px-6 py-3 shadow-md"
      >
        <div className="flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#0d9488" />
            <rect x="13" y="4" width="6" height="6" rx="1" fill="white" />
            <rect x="4" y="22" width="8" height="6" rx="1" fill="white" />
            <rect x="20" y="22" width="8" height="6" rx="1" fill="white" />
            <line x1="16" y1="10" x2="16" y2="18" stroke="white" strokeWidth="1.5" />
            <line x1="16" y1="18" x2="8" y2="22" stroke="white" strokeWidth="1.5" />
            <line x1="16" y1="18" x2="24" y2="22" stroke="white" strokeWidth="1.5" />
          </svg>
          <div>
            <h1 className="text-white font-bold text-xl leading-none">Diagramr</h1>
            <p className="text-blue-200 text-xs mt-0.5">Visualize any process with AI</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Undo/Redo */}
          {hasNodes && (
            <div className="flex gap-2">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="p-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg transition-colors"
                title="Undo (Cmd+Z)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10L8 5m-5 5l5 5" />
                </svg>
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="p-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg transition-colors"
                title="Redo (Cmd+Shift+Z)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m21-10l-5-5m5 5l-5 5" />
                </svg>
              </button>
            </div>
          )}

          {/* Share */}
          {hasNodes && (
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Copy shareable link"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          )}

          {/* Export + Save/Load dropdown */}
          {hasNodes && (
            <ExportDropdown nodes={nodes} edges={edges} diagramType={diagramType} onLoad={onLoad} />
          )}

          {/* Presenter Mode */}
          {hasNodes && (
            <button
              onClick={onPresenterMode}
              className="p-2 text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Presenter mode (fullscreen)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          )}

          {/* Style toggle */}
          <button
            onClick={onToggleStyle}
            title={diagramStyle === 'sketch' ? 'Switch to sleek look' : 'Switch to hand-sketch look'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            {diagramStyle === 'sketch' ? '✨ Sleek' : '✏️ Sketch'}
          </button>

          {/* Dark Mode */}
          <DarkModeToggle />
        </div>
      </header>

      {/* Share toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-xl pointer-events-none">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Link copied!
        </div>
      )}
    </>
  )
}
