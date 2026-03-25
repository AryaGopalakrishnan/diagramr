import { getSmoothStepPath, EdgeLabelRenderer } from 'reactflow'
import { useDiagramStyle } from '../contexts/DiagramStyleContext'

const STROKE = '#6b7280'
const STROKE_SEL = '#1e3a8a'
const STROKE_SLEEK = '#94a3b8'
const STROKE_SEL_SLEEK = '#1e3a8a'

export default function SketchEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  selected,
  data,
}) {
  const diagramStyle = useDiagramStyle()
  const isSleek = diagramStyle === 'sleek'
  const isCrossLane = data?.crossLane === true

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: isSleek ? 16 : 10,
  })

  const stroke = isCrossLane
    ? (selected ? '#475569' : '#64748b')
    : selected
      ? (isSleek ? STROKE_SEL_SLEEK : STROKE_SEL)
      : (isSleek ? STROKE_SLEEK : STROKE)
  const strokeWidth = selected ? 2 : (isSleek ? 1.5 : 1.8)
  const strokeDasharray = isCrossLane ? '6 4' : undefined

  return (
    <>
      <defs>
        {!isSleek && (
          <filter id="sketch-edge-wobble" x="-5%" y="-30%" width="110%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="3" seed="9" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        )}
        <marker id={isSleek ? 'sleek-arrow' : 'sketch-arrow'} markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
          <path
            d="M 2 2 L 8 5 L 2 8"
            stroke={STROKE}
            strokeWidth={isSleek ? '1.2' : '1.4'}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </marker>
        <marker id={isSleek ? 'sleek-arrow-sel' : 'sketch-arrow-sel'} markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
          <path
            d="M 2 2 L 8 5 L 2 8"
            stroke={STROKE_SEL}
            strokeWidth={isSleek ? '1.2' : '1.4'}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </marker>
      </defs>

      {/* Wider invisible path for easier clicking */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
        style={{ cursor: 'pointer' }}
      />

      {/* Visible path */}
      <path
        d={edgePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
        filter={(!isSleek && !isCrossLane) ? 'url(#sketch-edge-wobble)' : undefined}
        markerEnd={selected
          ? `url(#${isSleek ? 'sleek-arrow-sel' : 'sketch-arrow-sel'})`
          : `url(#${isSleek ? 'sleek-arrow' : 'sketch-arrow'})`}
        style={{ pointerEvents: 'none' }}
      />

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontFamily: isSleek ? 'Inter, sans-serif' : "'Caveat', cursive",
              fontSize: isSleek ? 11 : 13,
              fontWeight: isSleek ? 500 : 700,
              color: '#374151',
              background: '#f9fafb',
              padding: '1px 7px',
              borderRadius: 4,
              border: '1px solid #e5e7eb',
              pointerEvents: 'none',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
