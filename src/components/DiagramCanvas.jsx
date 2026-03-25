import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import ReactFlow, {
  Controls,
  Background,
  BackgroundVariant,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'

import StartNode from '../nodes/StartNode'
import EndNode from '../nodes/EndNode'
import ProcessNode from '../nodes/ProcessNode'
import DecisionNode from '../nodes/DecisionNode'
import InputOutputNode from '../nodes/InputOutputNode'
import SketchEdge from '../edges/SketchEdge'
import StylePanel from './StylePanel'
import SwimlaneBackground from './SwimlaneBackground'

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  process: ProcessNode,
  decision: DecisionNode,
  inputOutput: InputOutputNode,
}

const edgeTypes = {
  sketch: SketchEdge,
}

const defaultEdgeOptions = {
  type: 'sketch',
}

export default function DiagramCanvas({ nodes, edges, setNodes, setEdges, isLoading, presenterMode, nodeHighlights, fitViewTrigger, lanes }) {
  const isSwimlane = lanes && lanes.length > 0
  const { fitView } = useReactFlow()
  const prevTriggerRef = useRef(fitViewTrigger)

  useEffect(() => {
    if (fitViewTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = fitViewTrigger
      setTimeout(() => fitView({ padding: 0.2, duration: 400 }), 50)
    }
  }, [fitViewTrigger, fitView])

  const nodesWithHighlights = useMemo(() => {
    if (!nodeHighlights || nodeHighlights.size === 0) return nodes
    return nodes.map((n) =>
      nodeHighlights.has(n.id)
        ? { ...n, data: { ...n.data, highlight: nodeHighlights.get(n.id) } }
        : n
    )
  }, [nodes, nodeHighlights])

  const nodeIndexMap = useMemo(() => {
    const m = new Map()
    nodes.forEach((n) => m.set(n.id, n))
    return m
  }, [nodes])

  const enrichedEdges = useMemo(() => {
    if (!isSwimlane) return edges
    return edges.map((e) => {
      const src = nodeIndexMap.get(e.source)
      const tgt = nodeIndexMap.get(e.target)
      const crossLane = src && tgt && src.data?.laneIndex !== tgt.data?.laneIndex
      return crossLane ? { ...e, data: { ...e.data, crossLane: true } } : e
    })
  }, [edges, nodeIndexMap, isSwimlane])
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState(null)

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null
  const selectedEdge = selectedEdgeId ? edges.find((e) => e.id === selectedEdgeId) : null

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  )

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  )

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((_, node) => {
    setSelectedNodeId(node.id)
    setSelectedEdgeId(null)
  }, [])

  const onEdgeClick = useCallback((_, edge) => {
    setSelectedEdgeId(edge.id)
    setSelectedNodeId(null)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
  }, [])

  const onUpdateNode = useCallback(
    (nodeId, updatedNode) => {
      setNodes((nds) => nds.map((n) => (n.id === nodeId ? updatedNode : n)))
    },
    [setNodes]
  )

  const onUpdateEdge = useCallback(
    (edgeId, updatedEdge) => {
      setEdges((eds) => eds.map((e) => (e.id === edgeId ? updatedEdge : e)))
    },
    [setEdges]
  )

  const onPaneContextMenu = useCallback(
    (e) => {
      e.preventDefault()
      const id = `node-${Date.now()}`
      const newNode = {
        id,
        type: 'process',
        position: { x: e.clientX - 200, y: e.clientY - 100 },
        data: { label: 'New Step' },
      }
      setNodes((nds) => [...nds, newNode])
    },
    [setNodes]
  )

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId))
          setSelectedNodeId(null)
        }
        if (selectedEdgeId) {
          setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId))
          setSelectedEdgeId(null)
        }
      }
    },
    [selectedNodeId, selectedEdgeId, setNodes, setEdges]
  )

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-gray-900 transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#1e3a5f] dark:text-white font-medium">Generating your diagram…</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Claude is analyzing your process</p>
        </div>
      </div>
    )
  }

  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-gray-900 transition-colors">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-[#1e3a5f]/10 dark:bg-[#1e3a5f]/20">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="16" y="4" width="8" height="8" rx="1.5" fill="#1e3a5f" opacity="0.6" />
              <rect x="4" y="28" width="10" height="8" rx="1.5" fill="#1e3a5f" opacity="0.6" />
              <rect x="26" y="28" width="10" height="8" rx="1.5" fill="#1e3a5f" opacity="0.6" />
              <line x1="20" y1="12" x2="20" y2="22" stroke="#1e3a5f" strokeWidth="2" opacity="0.4" />
              <line x1="20" y1="22" x2="9" y2="28" stroke="#1e3a5f" strokeWidth="2" opacity="0.4" />
              <line x1="20" y1="22" x2="31" y2="28" stroke="#1e3a5f" strokeWidth="2" opacity="0.4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[#1e3a5f] dark:text-white">Describe your process above</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
            Type a description of any workflow, process, or system and click{' '}
            <span className="font-semibold text-[#1e3a5f] dark:text-white">Generate</span> to create a diagram instantly.
          </p>
          <div className="flex flex-col gap-1.5 text-xs text-gray-400 dark:text-gray-500 text-left w-full bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <p className="font-semibold text-gray-500 dark:text-gray-400 mb-1">Tips:</p>
            <p>• Right-click canvas to add a node manually</p>
            <p>• Double-click any node to edit its label</p>
            <p>• Click an edge to delete it</p>
            <p>• Press Delete to remove selected nodes</p>
            <p>• Drag nodes to rearrange the layout</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex bg-[#f8fafc] dark:bg-gray-900 transition-colors">
      <div
        className="flex-1"
        onKeyDown={onKeyDown}
        tabIndex={0}
        style={{ outline: 'none' }}
      >
        <ReactFlow
          nodes={nodesWithHighlights}
          edges={enrichedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onPaneContextMenu={onPaneContextMenu}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className={isSwimlane ? 'bg-slate-100 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'}
        >
          {isSwimlane
            ? <SwimlaneBackground lanes={lanes} nodes={nodes} />
            : <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
          }
          <Controls style={{ bottom: 12, right: 12, left: 'auto' }} />
        </ReactFlow>
      </div>
      {!presenterMode && (
        <StylePanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onUpdateNode={onUpdateNode}
          onUpdateEdge={onUpdateEdge}
        />
      )}
    </div>
  )
}
