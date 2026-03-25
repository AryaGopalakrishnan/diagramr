import { useState, useCallback, useEffect, useRef } from 'react'
import { Handle, Position, useReactFlow } from 'reactflow'
import rough from 'roughjs'
import { useDiagramStyle } from '../contexts/DiagramStyleContext'

const W = 180, H = 56

export default function ProcessNode({ id, data, selected }) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(data.label || 'Process')
  const { setNodes } = useReactFlow()
  const svgRef = useRef(null)
  const diagramStyle = useDiagramStyle()

  const fillColor = data.style?.background || '#3b82f6'
  const fontSize = data.fontSize || 15

  const commitEdit = useCallback(() => {
    setEditing(false)
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n))
    )
  }, [id, label, setNodes])

  useEffect(() => {
    if (diagramStyle !== 'sketch') return
    const svg = svgRef.current
    if (!svg) return
    svg.innerHTML = ''
    const rc = rough.svg(svg)
    svg.appendChild(rc.rectangle(4, 4, W - 8, H - 8, {
      fill: fillColor,
      fillStyle: 'hachure',
      hachureAngle: -41,
      hachureGap: 12,
      fillWeight: 1.5,
      stroke: selected ? '#1e3a8a' : '#1a1a1a',
      strokeWidth: selected ? 2.5 : 1.8,
      roughness: 1.2,
      bowing: 1,
      seed: 1,
    }))
  }, [fillColor, selected, diagramStyle])

  const highlightColor = data.highlight === 'added' ? '#22c55e' : data.highlight === 'removed' ? '#ef4444' : data.highlight === 'modified' ? '#eab308' : null
  const highlightStyle = highlightColor ? { boxShadow: `0 0 0 3px ${highlightColor}`, borderRadius: 6 } : {}

  if (diagramStyle === 'sleek') {
    return (
      <div
        onDoubleClick={() => setEditing(true)}
        style={{
          width: W, height: H, cursor: 'pointer', position: 'relative',
          background: fillColor,
          borderRadius: 8,
          border: `1.5px solid ${selected ? '#1e3a8a' : '#2563eb'}`,
          boxShadow: selected ? `0 0 0 2px #1e3a8a, 0 4px 12px rgba(59,130,246,0.35)` : '0 2px 8px rgba(59,130,246,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...highlightStyle,
        }}
      >
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: fontSize - 1, fontWeight: 600, color: '#fff', padding: '0 12px', textAlign: 'center', wordBreak: 'break-word', pointerEvents: editing ? 'auto' : 'none' }}>
          {editing ? (
            <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} onBlur={commitEdit} onKeyDown={(e) => e.key === 'Enter' && commitEdit()} style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: fontSize - 1, fontWeight: 600, textAlign: 'center', width: '100%' }} />
          ) : (
            <span>{data.icon && <span style={{ marginRight: 4 }}>{data.icon}</span>}{label}</span>
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
        fontSize: fontSize,
        fontWeight: 600,
        color: '#1a1a1a',
        pointerEvents: editing ? 'auto' : 'none',
        padding: '0 12px',
        textAlign: 'center',
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
