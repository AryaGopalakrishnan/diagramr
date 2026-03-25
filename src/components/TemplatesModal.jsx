import { useEffect, useState, useMemo } from 'react'

const DIAGRAM_TYPES = [
  { value: 'decision tree',  label: 'Decision Tree',  icon: '🌳', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', border: 'hover:border-yellow-400' },
  { value: 'swimlane',       label: 'Swimlane',       icon: '🏊', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',       border: 'hover:border-cyan-400' },
  { value: 'roadmap',        label: 'Roadmap',        icon: '🗺️', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', border: 'hover:border-orange-400' },
  { value: 'planning',       label: 'Planning',       icon: '📋', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',   border: 'hover:border-green-400' },
]

const TEMPLATES = [
  {
    id: 'user-login',
    name: 'User Login Flow',
    icon: '🔐',
    description: 'Auth check, session creation, and error handling',
    diagramType: 'decision tree',
    category: 'Engineering',
    promptText: "Generate a User Login decision tree showing: credential input, auth check, session creation, error handling for failed attempts, and password reset path.",
  },
  {
    id: 'ecommerce-order',
    name: 'E-commerce Order Flow',
    icon: '🛒',
    description: 'Cart to checkout with payment validation and shipping',
    diagramType: 'decision tree',
    category: 'Engineering',
    promptText: "Generate an E-commerce Order decision tree from cart to delivery including: cart review, payment validation, fraud check, fulfillment, shipping, and delivery confirmation.",
  },
  {
    id: 'bug-triage',
    name: 'Bug Triage',
    icon: '🐛',
    description: 'Classify, prioritize, and route issues to resolution',
    diagramType: 'decision tree',
    category: 'Engineering',
    promptText: "Generate a Bug Triage decision tree showing: bug report intake, severity classification, assignment routing, resolution path, and verification step.",
  },
  {
    id: 'sprint-retro',
    name: 'Sprint Retrospective',
    icon: '🔄',
    description: 'Team reflection, blockers, and action item tracking',
    diagramType: 'planning',
    category: 'Product',
    promptText: "Generate a Sprint Retrospective planning diagram showing: team reflection phase, blockers identification, action item creation, and owner assignment. Include decision points for unresolved blockers.",
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    icon: '🚀',
    description: 'QA, staging, stakeholder sign-off, and go-live',
    diagramType: 'roadmap',
    category: 'Product',
    promptText: "Generate a Product Launch roadmap showing: QA phase, staging environment, stakeholder sign-off gate, go/no-go decision, and go-live step with rollback path.",
  },
  {
    id: 'employee-onboarding',
    name: 'Employee Onboarding',
    icon: '👋',
    description: 'From offer acceptance to day-one readiness',
    diagramType: 'decision tree',
    category: 'HR',
    promptText: "Generate an Employee Onboarding process flow from offer acceptance to day-one readiness including: document collection, system access setup, equipment provision, and orientation schedule.",
  },
]

const TYPE_COLORS = {
  'decision tree': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  'planning':      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'roadmap':       'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
}

const TYPE_LABELS = {
  'decision tree': 'Decision Tree',
  'planning':      'Planning',
  'roadmap':       'Roadmap',
}

const CATEGORIES = ['All', 'Engineering', 'Product', 'HR']

export default function TemplatesModal({ isOpen, onClose, onSelectTemplate, onLoadBlank }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setSearch('')
      setActiveCategory('All')
    }
  }, [isOpen])

  const filtered = useMemo(() => {
    return TEMPLATES.filter((t) => {
      const matchesCategory = activeCategory === 'All' || t.category === activeCategory
      const matchesSearch = !search.trim() ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [search, activeCategory])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Templates</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Choose a template to pre-fill your prompt</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search + filters */}
        <div className="px-6 pt-4 pb-2 space-y-3 flex-shrink-0">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-[#1e3a5f] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto p-6 pt-3 space-y-6">

          {/* Diagram Types */}
          {(activeCategory === 'All' && !search) && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Diagram Types</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {DIAGRAM_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => onSelectTemplate({ diagramType: t.value })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${t.border} hover:shadow-md transition-all duration-150`}
                  >
                    <span className="text-2xl">{t.icon}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.color}`}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            {(activeCategory === 'All' && !search) && (
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Templates</h3>
            )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Blank Canvas — always first, always visible */}
            {(activeCategory === 'All' && !search) && (
              <button
                onClick={onLoadBlank}
                className="group text-left p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#0d9488] dark:hover:border-[#0d9488] hover:shadow-md transition-all duration-150"
              >
                <div className="text-3xl mb-3">✏️</div>
                <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1 group-hover:text-[#0d9488] transition-colors">
                  Blank Canvas
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                  Start from scratch with an empty diagram
                </div>
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  Any type
                </span>
              </button>
            )}

            {filtered.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => onSelectTemplate({ diagramType: tpl.diagramType, promptText: tpl.promptText })}
                className="group text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-[#0d9488] dark:hover:border-[#0d9488] hover:shadow-md transition-all duration-150"
              >
                <div className="text-3xl mb-3">{tpl.icon}</div>
                <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1 group-hover:text-[#0d9488] transition-colors">
                  {tpl.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                  {tpl.description}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[tpl.diagramType] ?? 'bg-gray-100 text-gray-600'}`}>
                    {TYPE_LABELS[tpl.diagramType] || tpl.diagramType}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{tpl.category}</span>
                </div>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-3 py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                No templates match your search.
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
