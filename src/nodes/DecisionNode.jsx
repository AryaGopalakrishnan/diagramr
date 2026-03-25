import { useState, useCallback, useEffect, useRef } from 'react'
import { Handle, Position, useReactFlow } from 'reactflow'
import rough from 'roughjs'
import { useDiagramStyle } from '../contexts/DiagramStyleContext'

const W = 130, H = 130

export default function DecisionNode({ id, data, selected }) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(data.label || 'Decision?')
  const { setNodes } = useReactFlow()
  const svgRef = useRef(null)
  const diagramStyle = useDiagramStyle()

  const fillColor = data.style?.background || '#eab308'
  const fontSize = data.fontSize || 13

  const commitEdit = useCallback(() => {
    setEditing(false)
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n))
    )
  }, [id, label, setNodes])

  const diamond = [
    [W / 2, 4],
    [W - 4, H / 2],
    [W / 2, H - 4],
    [4, H / 2],
  ]

  useEffect(() => {
    if (diagramStyle !== 'sketch') return
    const svg = svgRef.current
    if (!svg) return
    svg.innerHTML = ''
    const rc = rough.svg(svg)
    svg.appendChild(rc.polygon(diamond, {
      fill: fillColor,
      fillStyle: 'hachure',
      hachureAngle: -41,
      hachureGap: 12,
      fillWeight: 1.5,
      stroke: selected ? '#713f12' : '#1a1a1a',
      strokeWidth: selected ? 2.5 : 1.8,
      roughness: 1.2,
      bowing: 1,
      seed: 4,
    }))
  }, [fillColor, selected, diagramStyle])

  const highlightColor = data.highlight === 'added' ? '#22c55e' : data.highlight === 'removed' ? '#ef4444' : data.highlight === 'modified' ? '#eab308' : null
  const highlightStyle = highlightColor ? { boxShadow: `0 0 0 3px ${highlightColor}`, borderRadius: 4 } : {}

  if (diagramStyle === 'sleek') {
    const d = W / 2
    return (
      <div
        onDoubleClick={() => setEditing(true)}
        style={{ position: 'relative', width: W, height: H, cursor: 'pointer', ...highlightStyle }}
      >
        {/* CSS diamond via rotated square */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: d, height: d,
          marginTop: -d / 2, marginLeft: -d / 2,
          background: fillColor,
          transform: 'rotate(45deg)',
          borderRadius: 6,
          border: `1.5px solid ${selected ? '#713f12' : '#ca8a04'}`,
          boxShadow: selected ? `0 0 0 2px #713f12, 0 4px 12px rgba(234,179,8,0.35)` : '0 2px 8px rgba(234,179,8,0.25)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Inter, sans-serif', fontSize: fontSize, fontWeight: 700, color: '#1a1a1a',
          padding: '0 24px', textAlign: 'center', zIndex: 1,
          pointerEvents: editing ? 'auto' : 'none',
        }}>
          {editing ? (
            <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} onBlur={commitEdit} onKeyDown={(e) => e.key === 'Enter' && commitEdit()} style={{ background: 'transparent', border: 'none', outline: 'none', color: '#1a1a1a', fontFamily: 'Inter, sans-serif', fontSize: fontSize, fontWeight: 700, textAlign: 'center', width: '100%' }} />
          ) : (
            <span style={{ wordBreak: 'break-word' }}>{data.icon && <span style={{ marginRight: 4 }}>{data.icon}</span>}{label}</span>
          )}
        </div>
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} id="yes" />
        <Handle type="source" position={Position.Right} id="no" />
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
        fontSize: fontSize, fontWeight: 700, color: '#1a1a1a',
        pointerEvents: editing ? 'auto' : 'none',
        padding: '0 24px', textAlign: 'center',
      }}>
        {editing ? (
          <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} onBlur={commitEdit} onKeyDown={(e) => e.key === 'Enter' && commitEdit()} style={{ background: 'transparent', border: 'none', outline: 'none', color: '#1a1a1a', fontFamily: "'Caveat', cursive", fontSize: fontSize, fontWeight: 700, textAlign: 'center', width: '100%' }} />
        ) : (
          <span style={{ wordBreak: 'break-word' }}>{data.icon && <span style={{ marginRight: 4 }}>{data.icon}</span>}{label}</span>
        )}
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} id="yes" />
      <Handle type="source" position={Position.Right} id="no" />
    </div>
  )
}
