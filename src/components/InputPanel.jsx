import { useState, useRef, useCallback } from 'react'
import ExamplePrompts from './ExamplePrompts'
import TemplatesModal from './TemplatesModal'
import { detectDiagramType } from '../utils/generateDiagram'

// Map detected type names (from API) to dropdown values
const TYPE_MAP = {
  'Flowchart':     'decision tree',
  'Process Flow':  'decision tree',
  'Decision Tree': 'decision tree',
  'Swimlane':      'swimlane',
  'Roadmap':       'roadmap',
  'Planning':      'planning',
}

export default function InputPanel({
  prompt,
  setPrompt,
  diagramType,
  setDiagramType,
  onGenerate,
  isLoading,
  error,
}) {
  const [showTemplates, setShowTemplates] = useState(false)
  const [detectedType, setDetectedType] = useState(null)      // { type, confidence, reason }
  const [isManualOverride, setIsManualOverride] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const textareaRef = useRef(null)
  const debounceRef = useRef(null)

  // Auto-detect diagram type with 500ms debounce
  const runDetection = useCallback(async (text) => {
    if (text.trim().length < 10 || isManualOverride) return
    setIsDetecting(true)
    try {
      const result = await detectDiagramType(text)
      setDetectedType(result)
      const mapped = TYPE_MAP[result.type]
      if (mapped && result.confidence >= 0.7) {
        setDiagramType(mapped)
      }
    } catch {
      // silent fail
    } finally {
      setIsDetecting(false)
    }
  }, [isManualOverride, setDiagramType])

  const handlePromptChange = useCallback((e) => {
    const val = e.target.value
    setPrompt(val)
    setDetectedType(null)
    clearTimeout(debounceRef.current)
    if (val.trim().length >= 10) {
      debounceRef.current = setTimeout(() => runDetection(val), 500)
    }
  }, [setPrompt, runDetection])

  const handleTemplateSelect = useCallback(({ diagramType: type, promptText }) => {
    setShowTemplates(false)
    if (type) setDiagramType(type)
    if (promptText !== undefined) setPrompt(promptText)
    setIsManualOverride(true)
    setDetectedType(null)
    // Scroll + highlight textarea
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      textareaRef.current?.classList?.add('ring-2', 'ring-[#0d9488]')
      setTimeout(() => textareaRef.current?.classList?.remove('ring-2', 'ring-[#0d9488]'), 1500)
    })
  }, [setDiagramType, setPrompt])

  const showAutoLabel = detectedType && !isManualOverride
  const showChips = showAutoLabel && detectedType.confidence < 0.7
  const altType = detectedType?.type === 'Flowchart' ? 'Process Flow' : 'Flowchart'

  return (
    <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
      <div className="max-w-4xl mx-auto space-y-3">

        {/* Low-confidence chips */}
        {showChips && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="text-gray-500 dark:text-gray-400">Looks like a</span>
            {[detectedType.type, altType].map((t) => (
              <button
                key={t}
                onClick={() => {
                  const mapped = TYPE_MAP[t] || 'decision tree'
                  setDiagramType(mapped)
                  setIsManualOverride(true)
                  setDetectedType({ ...detectedType, type: t, confidence: 0.9 })
                }}
                className="px-3 py-1 rounded-full text-xs font-medium bg-[#1e3a5f]/10 text-[#1e3a5f] dark:bg-blue-900/30 dark:text-blue-300 hover:bg-[#1e3a5f]/20 transition-colors border border-[#1e3a5f]/20"
              >
                {t}
              </button>
            ))}
            <span className="text-gray-400 dark:text-gray-500">— which fits better?</span>
          </div>
        )}

        {/* Textarea + controls row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handlePromptChange}
              placeholder="Describe your process in plain English… e.g. 'A customer submits a support ticket, an agent reviews it, and either resolves or escalates it to a manager.'"
              rows={3}
              className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onGenerate()
              }}
            />
          </div>

          <div className="flex flex-col gap-2 min-w-[160px]">
            <button
              onClick={onGenerate}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1e3a5f] hover:bg-blue-900 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Generating…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate
                </>
              )}
            </button>

            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-[#0d9488] hover:text-[#0d9488] dark:hover:text-[#0d9488] rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Templates
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Example prompts */}
        <ExamplePrompts
          onSelect={(text) => {
            setPrompt(text)
            onGenerate(text)
          }}
        />
      </div>

      <TemplatesModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleTemplateSelect}
        onLoadBlank={() => {
          setShowTemplates(false)
          setPrompt('')
          setDiagramType('decision tree')
          setDetectedType(null)
          setIsManualOverride(false)
        }}
      />
    </div>
  )
}
