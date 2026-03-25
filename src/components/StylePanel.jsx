import { useState } from 'react'

const COLORS = [
  { name: 'Teal', value: '#0d9488', bg: '#f0fdfa' },
  { name: 'Blue', value: '#0284c7', bg: '#f0f9ff' },
  { name: 'Purple', value: '#7c3aed', bg: '#faf5ff' },
  { name: 'Red', value: '#dc2626', bg: '#fef2f2' },
  { name: 'Green', value: '#16a34a', bg: '#f0fdf4' },
  { name: 'Orange', value: '#ea580c', bg: '#fff7ed' },
  { name: 'Pink', value: '#db2777', bg: '#fdf2f8' },
  { name: 'Indigo', value: '#4f46e5', bg: '#f4f3ff' },
]

const ICONS = {
  business: ['👤', '👥', '💼', '🏢', '📊', '📈'],
  tech: ['💻', '⚙️', '🔧', '📱', '🖥️', '🔌'],
  logistics: ['🚚', '📦', '🏪', '🚛', '✈️', '🚢'],
  medical: ['🏥', '⚕️', '💊', '🩺', '🏨', '❤️'],
  finance: ['💰', '💳', '📱', '📊', '💹', '🏦'],
  education: ['📚', '🎓', '✏️', '📖', '🎒', '👨‍🎓'],
}

const SHAPES = ['circle', 'square', 'diamond', 'hexagon', 'triangle']

const ARROW_TYPES = [
  { value: 'default', label: '→ Default' },
  { value: 'smooth', label: '⟿ Smooth Curve' },
  { value: 'step', label: '↳ Step' },
  { value: 'straight', label: '| Straight' },
]

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24]

export default function StylePanel({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
}) {
  const [showColors, setShowColors] = useState(false)
  const [showIcons, setShowIcons] = useState(false)
  const [activeIconCategory, setActiveIconCategory] = useState('business')

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="w-64 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm transition-colors">
        Select a node or edge to customize
      </div>
    )
  }

  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 overflow-y-auto transition-colors">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {selectedNode ? 'Node Styling' : 'Edge Styling'}
      </h3>

      {/* Color Picker */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
          🎨 Color
        </label>
        <div className="grid grid-cols-4 gap-2">
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => {
                if (selectedNode) {
                  onUpdateNode(selectedNode.id, {
                    ...selectedNode,
                    style: { ...selectedNode.style, background: color.value, fill: color.value },
                  })
                }
              }}
              className="w-full aspect-square rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Icons */}
      {selectedNode && (
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            🎯 Icons by Industry
          </label>
          <div className="flex gap-2 mb-3 flex-wrap">
            {Object.keys(ICONS).map((category) => (
              <button
                key={category}
                onClick={() => setActiveIconCategory(category)}
                className={`px-2 py-1 text-xs rounded capitalize font-medium transition-colors ${
                  activeIconCategory === category
                    ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-2">
            {ICONS[activeIconCategory].map((icon, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onUpdateNode(selectedNode.id, {
                    ...selectedNode,
                    data: { ...selectedNode.data, icon },
                  })
                }}
                className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-2xl flex items-center justify-center transition-colors"
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Shapes */}
      {selectedNode && (
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            ⬜ Shape
          </label>
          <div className="grid grid-cols-5 gap-2">
            {SHAPES.map((shape) => (
              <button
                key={shape}
                onClick={() => {
                  onUpdateNode(selectedNode.id, {
                    ...selectedNode,
                    data: { ...selectedNode.data, shape },
                  })
                }}
                className="aspect-square rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors flex items-center justify-center p-2"
                title={shape}
              >
                {shape === 'circle' && (
                  <div className="w-6 h-6 rounded-full bg-teal-500" />
                )}
                {shape === 'square' && (
                  <div className="w-6 h-6 rounded-md bg-teal-500" />
                )}
                {shape === 'diamond' && (
                  <div className="w-5 h-5 bg-teal-500 transform rotate-45" />
                )}
                {shape === 'hexagon' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L21 7V17L12 22L3 17V7L12 2Z"
                      fill="#14b8a6"
                      stroke="#0d9488"
                      strokeWidth="1"
                    />
                  </svg>
                )}
                {shape === 'triangle' && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 2L18 16H2L10 2Z"
                      fill="#14b8a6"
                      stroke="#0d9488"
                      strokeWidth="1"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Font Size */}
      {selectedNode && (
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            📝 Font Size
          </label>
          <div className="grid grid-cols-4 gap-2">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => {
                  onUpdateNode(selectedNode.id, {
                    ...selectedNode,
                    data: { ...selectedNode.data, fontSize: size },
                  })
                }}
                className="aspect-square rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors text-sm font-medium text-gray-700 dark:text-gray-100"
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Arrow Types */}
      {selectedEdge && (
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            ➜ Arrow Type
          </label>
          <div className="space-y-2">
            {ARROW_TYPES.map((arrow) => (
              <button
                key={arrow.value}
                onClick={() => {
                  onUpdateEdge(selectedEdge.id, {
                    ...selectedEdge,
                    animated: arrow.value === 'smooth',
                    type: arrow.value,
                  })
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors text-left text-gray-700 dark:text-gray-200"
              >
                {arrow.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Edge Color */}
      {selectedEdge && (
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            🎨 Color
          </label>
          <div className="grid grid-cols-4 gap-2">
            {COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => {
                  onUpdateEdge(selectedEdge.id, {
                    ...selectedEdge,
                    style: { stroke: color.value, strokeWidth: 2 },
                  })
                }}
                className="w-full aspect-square rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Edge Stroke Width */}
      {selectedEdge && (
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            ↔️ Thickness
          </label>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((width) => (
              <button
                key={width}
                onClick={() => {
                  onUpdateEdge(selectedEdge.id, {
                    ...selectedEdge,
                    style: { ...selectedEdge.style, strokeWidth: width },
                  })
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors text-left"
              >
                <div
                  className="h-1 bg-gray-800 dark:bg-gray-200"
                  style={{ height: `${width}px` }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
