import { useState, useCallback, useEffect, useRef } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { DiagramStyleContext } from './contexts/DiagramStyleContext'
import Header from './components/Header'
import InputPanel from './components/InputPanel'
import DiagramCanvas from './components/DiagramCanvas'
import RefinePanel from './components/RefinePanel'
import ExportToolbar from './components/ExportToolbar'
import ConfluenceModal from './components/ConfluenceModal'
import JiraModal from './components/JiraModal'
import { generateDiagram, refineDiagramWithDiff } from './utils/generateDiagram'
import { useHistory } from './hooks/useHistory'
import { useDarkMode } from './hooks/useDarkMode'

function decodeShareHash(hash) {
  const binary = atob(hash)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

export default function App() {
  useDarkMode()

  const [prompt, setPrompt] = useState('')
  const [diagramType, setDiagramType] = useState('decision tree')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [presenterMode, setPresenterMode] = useState(false)
  const [diagramStyle, setDiagramStyle] = useState('sketch') // 'sketch' | 'sleek'

  // Node diff highlights: Map<nodeId, 'added'|'removed'|'modified'>
  const [nodeHighlights, setNodeHighlights] = useState(new Map())
  const [fitViewTrigger, setFitViewTrigger] = useState(0)
  const highlightTimeoutRef = useRef(null)

  // Confluence / Jira modal state
  const [showConfluence, setShowConfluence] = useState(false)
  const [showJira, setShowJira] = useState(false)

  const {
    state: diagramState,
    setState: setDiagramState,
    undo: historyUndo,
    redo: historyRedo,
    canUndo,
    canRedo,
  } = useHistory({ nodes: [], edges: [], lanes: [] })

  const nodes = diagramState.nodes
  const edges = diagramState.edges
  const lanes = diagramState.lanes || []

  const setNodes = useCallback((updater) => {
    const newNodes = typeof updater === 'function' ? updater(nodes) : updater
    setDiagramState({ nodes: newNodes, edges, lanes })
  }, [nodes, edges, lanes, setDiagramState])

  const setEdges = useCallback((updater) => {
    const newEdges = typeof updater === 'function' ? updater(edges) : updater
    setDiagramState({ nodes, edges: newEdges, lanes })
  }, [nodes, edges, lanes, setDiagramState])

  // Load diagram from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) return
    try {
      const data = decodeShareHash(hash)
      if (data.nodes?.length && data.edges) {
        setDiagramState({ nodes: data.nodes, edges: data.edges })
        if (data.diagramType) setDiagramType(data.diagramType)
      }
    } catch {
      // invalid hash — ignore
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && presenterMode) {
        setPresenterMode(false)
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        historyUndo()
      } else if ((e.metaKey || e.ctrlKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault()
        historyRedo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [historyUndo, historyRedo, presenterMode])

  const applyHighlights = useCallback((changes) => {
    if (!changes || changes.length === 0) return
    const map = new Map()
    changes.forEach(({ type, nodeId }) => {
      if (nodeId) map.set(nodeId, type)  // 'added' | 'removed' | 'modified'
    })
    setNodeHighlights(map)
    clearTimeout(highlightTimeoutRef.current)
    highlightTimeoutRef.current = setTimeout(() => setNodeHighlights(new Map()), 2000)
  }, [])

  const handleGenerate = useCallback(async (overridePrompt) => {
    const trimmed = (typeof overridePrompt === 'string' ? overridePrompt : prompt).trim()
    if (!trimmed) {
      setError('Please describe your process first.')
      return
    }
    setError(null)
    setIsLoading(true)
    try {
      const result = await generateDiagram(trimmed, diagramType)
      setDiagramState({ nodes: result.nodes, edges: result.edges, lanes: result.lanes || [] })
      setOriginalPrompt(trimmed)
      setFitViewTrigger(n => n + 1)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong generating your diagram. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [prompt, diagramType, setDiagramState])

  const handleRefine = useCallback(async (refineText, onSuccess, onError) => {
    setError(null)
    setIsLoading(true)
    try {
      const result = await refineDiagramWithDiff(
        { nodes, edges },
        refineText,
        diagramType,
        originalPrompt,
      )
      setDiagramState({ nodes: result.nodes, edges: result.edges, lanes: result.lanes?.length ? result.lanes : lanes })
      applyHighlights(result.changes)
      setFitViewTrigger(n => n + 1)
      onSuccess?.(result.suggestion || '')
    } catch (err) {
      console.error(err)
      onError?.(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [nodes, edges, diagramType, originalPrompt, setDiagramState, applyHighlights])

  const handleLoad = useCallback((diagram) => {
    setDiagramState({ nodes: diagram.nodes, edges: diagram.edges, lanes: diagram.lanes || [] })
    setDiagramType(diagram.diagramType)
    setPrompt('')
    setOriginalPrompt('')
  }, [setDiagramState])

  const hasNodes = nodes.length > 0

  return (
    <DiagramStyleContext.Provider value={diagramStyle}>
    <ReactFlowProvider>
      <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-gray-900 font-sans transition-colors">
        {!presenterMode && (
          <Header
            hasNodes={hasNodes}
            nodes={nodes}
            edges={edges}
            diagramType={diagramType}
            onLoad={handleLoad}
            onUndo={historyUndo}
            onRedo={historyRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            onPresenterMode={() => setPresenterMode(true)}
            diagramStyle={diagramStyle}
            onToggleStyle={() => setDiagramStyle(s => s === 'sketch' ? 'sleek' : 'sketch')}
          />
        )}
        {!presenterMode && (
          <InputPanel
            prompt={prompt}
            setPrompt={setPrompt}
            diagramType={diagramType}
            setDiagramType={setDiagramType}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            error={error}
          />
        )}
        {!presenterMode && (
          <ExportToolbar
            hasNodes={hasNodes}
            onConfluence={() => setShowConfluence(true)}
            onJira={() => setShowJira(true)}
          />
        )}
        <DiagramCanvas
          nodes={nodes}
          edges={edges}
          lanes={lanes}
          setNodes={setNodes}
          setEdges={setEdges}
          isLoading={isLoading}
          presenterMode={presenterMode}
          nodeHighlights={nodeHighlights}
          fitViewTrigger={fitViewTrigger}
        />
        {!presenterMode && (
          <RefinePanel
            onRefine={handleRefine}
            isLoading={isLoading}
            hasNodes={hasNodes}
          />
        )}
      </div>

      {/* Presenter mode exit button */}
      {presenterMode && (
        <button
          onClick={() => setPresenterMode(false)}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Exit (ESC)
        </button>
      )}

      <ConfluenceModal
        isOpen={showConfluence}
        onClose={() => setShowConfluence(false)}
        nodes={nodes}
        edges={edges}
        diagramTitle={originalPrompt ? originalPrompt.slice(0, 60) : 'My Diagram'}
      />

      <JiraModal
        isOpen={showJira}
        onClose={() => setShowJira(false)}
        nodes={nodes}
        edges={edges}
      />
    </ReactFlowProvider>
    </DiagramStyleContext.Provider>
  )
}
