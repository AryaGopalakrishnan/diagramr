import { useState, useCallback, useEffect, useRef } from 'react'
import { Handle, Position, useReactFlow } from 'reactflow'
import rough from 'roughjs'
import { useDiagramStyle } from '../contexts/DiagramStyleContext'

const W = 170, H = 58
const SKEW = 20

export default function InputOutputNode({ id, data, selected }) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(data.label || 'Input/Output')
  const { setNodes } = useReactFlow()
  const svgRef = useRef(null)
  const diagramStyle = useDiagramStyle()

  const fillColor = data.style?.background || '#8b5cf6'
  const fontSize = data.fontSize || 15

  const commitEdit = useCallback(() => {
    setEditing(false)
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n))
    )
  }, [id, label, setNodes])

  const parallelogram = [
    [SKEW + 4, 4],
    [W - 4, 4],
    [W - SKEW - 4, H - 4],
    [4, H - 4],
  ]

  useEffect(() => {
    if (diagramStyle !== 'sketch') return
    const svg = svgRef.current
    if (!svg) return
    svg.innerHTML = ''
    const rc = rough.svg(svg)
    svg.appendChild(rc.polygon(parallelogram, {
      fill: fillColor,
      fillStyle: 'hachure',
      hachureAngle: -41,
      hachureGap: 12,
      fillWeight: 1.5,
      stroke: selected ? '#4c1d95' : '#1a1a1a',
      strokeWidth: selected ? 2.5 : 1.8,
      roughness: 1.2,
      bowing: 1,
      seed: 5,
    }))
  }, [fillColor, selected, diagramStyle])

  const highlightColor = data.highlight === 'added' ? '#22c55e' : data.highlight === 'removed' ? '#ef4444' : data.highlight === 'modified' ? '#eab308' : null
  const highlightStyle = highlightColor ? { boxShadow: `0 0 0 3px ${highlightColor}`, borderRadius: 4 } : {}

  if (diagramStyle === 'sleek') {
    return (
      <div
        onDoubleClick={() => setEditing(true)}
        style={{ position: 'relative', width: W, height: H, cursor: 'pointer', ...highlightStyle }}
      >
        {/* Parallelogram background via skew */}
        <div style={{
          position: 'absolute', inset: 0,
          background: fillColor,
          transform: 'skewX(-12deg)',
          borderRadius: 6,
          border: `1.5px solid ${selected ? '#4c1d95' : '#7c3aed'}`,
          boxShadow: selected ? `0 0 0 2px #4c1d95, 0 4px 12px rgba(139,92,246,0.35)` : '0 2px 8px rgba(139,92,246,0.25)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Inter, sans-serif', fontSize: fontSize - 1, fontWeight: 600, color: '#fff',
          padding: '0 28px', textAlign: 'center', zIndex: 1,
          pointerEvents: editing ? 'auto' : 'none',
        }}>
          {editing ? (
            <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} onBlur={commitEdit} onKeyDown={(e) => e.key === 'Enter' && commitEdit()} style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: fontSize - 1, fontWeight: 600, textAlign: 'center', width: '100%' }} />
          ) : (
            <span style={{ wordBreak: 'break-word' }}>{data.icon && <span style={{ marginRight: 4 }}>{data.icon}</span>}{label}</span>
          )}
        </div>
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
      </div>
    )
  }

  return (
    <div
      onDoubleClick={() => setEditing(true)}
      style={{ position: 'relative', width: W, height: H, cursor: 'pointer', ...highlightStyle }}
    >
      <svg ref={svgRef} width={W} height={H} style={{ display: 'block', overflow: 'visible' }} />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Caveat', cursive",
        fontSize: fontSize, fontWeight: 600, color: '#1a1a1a',
        pointerEvents: editing ? 'auto' : 'none',
        padding: '0 28px', textAlign: 'center',
      }}>
        {editing ? (
          <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} onBlur={commitEdit} onKeyDown={(e) => e.key === 'Enter' && commitEdit()} style={{ background: 'transparent', border: 'none', outline: 'none', color: '#1a1a1a', fontFamily: "'Caveat', cursive", fontSize: fontSize, fontWeight: 600, textAlign: 'center', width: '100%' }} />
        ) : (
          <span style={{ wordBreak: 'break-word' }}>{data.icon && <span style={{ marginRight: 4 }}>{data.icon}</span>}{label}</span>
        )}
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
