import { useViewport } from 'reactflow'

const LANE_WIDTH = 240
const HEADER_HEIGHT = 60

export default function SwimlaneBackground({ lanes, nodes }) {
  const { x, y, zoom } = useViewport()

  if (!lanes || lanes.length === 0) return null

  const maxNodeY = nodes.length > 0
    ? Math.max(...nodes.map((n) => n.position.y + 160))
    : 800
  const totalHeight = Math.max(maxNodeY + 200, 600)
  const totalWidth = lanes.length * LANE_WIDTH

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translate(${x}px, ${y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: totalWidth,
          height: totalHeight,
        }}
      >
        {/* Alternating lane backgrounds */}
        {lanes.map((lane, i) => (
          <div
            key={lane.id}
            style={{
              position: 'absolute',
              left: i * LANE_WIDTH,
              top: 0,
              width: LANE_WIDTH,
              height: totalHeight,
              background: i % 2 === 0
                ? 'rgba(255,255,255,0.85)'
                : 'rgba(241,245,249,0.85)',
            }}
          />
        ))}

        {/* Vertical divider lines between lanes */}
        {lanes.map((lane, i) => i > 0 && (
          <div
            key={`divider-${lane.id}`}
            style={{
              position: 'absolute',
              left: i * LANE_WIDTH,
              top: 0,
              width: 1,
              height: totalHeight,
              background: '#cbd5e1',
            }}
          />
        ))}

        {/* Lane headers */}
        {lanes.map((lane, i) => (
          <div
            key={`header-${lane.id}`}
            style={{
              position: 'absolute',
              left: i * LANE_WIDTH,
              top: 0,
              width: LANE_WIDTH,
              height: HEADER_HEIGHT,
              background: lane.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: i < lanes.length - 1 ? '1px solid rgba(255,255,255,0.3)' : 'none',
            }}
          >
            <span
              style={{
                color: '#fff',
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: '0.01em',
                fontFamily: 'Inter, sans-serif',
                textShadow: '0 1px 2px rgba(0,0,0,0.15)',
              }}
            >
              {lane.name}
            </span>
          </div>
        ))}

        {/* Header bottom border */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: HEADER_HEIGHT,
            width: totalWidth,
            height: 2,
            background: 'rgba(0,0,0,0.08)',
          }}
        />
      </div>
    </div>
  )
}
