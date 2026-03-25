import { Handle, Position } from 'reactflow'

export default function CustomNode({ data, selected }) {
  const icon = data.icon || ''
  const fontSize = data.fontSize || 14
  const shape = data.shape || 'square'

  const shapeStyles = {
    circle: 'rounded-full w-24 h-24 flex items-center justify-center',
    square: 'rounded-lg w-24 h-24 flex items-center justify-center',
    diamond: 'w-24 h-24 flex items-center justify-center transform rotate-45',
    hexagon: 'w-24 h-24 flex items-center justify-center',
    triangle: 'w-24 h-24 flex items-center justify-center',
  }

  return (
    <div
      className={`${shapeStyles[shape]} bg-teal-50 border-2 border-teal-500 cursor-move transition-all hover:shadow-lg ${
        selected ? 'ring-4 ring-teal-300' : ''
      }`}
      style={{
        fontSize: `${fontSize}px`,
      }}
    >
      <div className="text-center">
        {icon && <div className="text-2xl mb-1">{icon}</div>}
        <div className="font-medium text-gray-700 break-words px-2">{data.label}</div>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
