import { useState, useRef, useEffect, useCallback } from 'react'

const REFINEMENT_CHIPS = []

function TypingDots() {
  return (
    <div className="flex items-center gap-1 h-4">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}

export default function RefinePanel({ onRefine, hasNodes }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isPending, setIsPending] = useState(false)
  const scrollRef = useRef(null)
  const pendingIdRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = useCallback((overrideText) => {
    const text = (typeof overrideText === 'string' ? overrideText : input).trim()
    if (!text || isPending) return

    setInput('')

    const aiId = `ai-${Date.now()}`
    pendingIdRef.current = aiId

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text },
      { id: aiId, role: 'ai', isTyping: true },
    ])
    setIsPending(true)

    onRefine(
      text,
      (suggestion) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingIdRef.current
              ? {
                  ...m,
                  isTyping: false,
                  text: suggestion ? `Diagram updated ✓\n\n💬 ${suggestion}` : 'Diagram updated ✓',
                }
              : m
          )
        )
        setIsPending(false)
        inputRef.current?.focus()
      },
      (errMsg) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingIdRef.current
              ? { ...m, isTyping: false, text: errMsg, isError: true }
              : m
          )
        )
        setIsPending(false)
        inputRef.current?.focus()
      }
    )
  }, [input, isPending, onRefine])

  if (!hasNodes) return null

  const hasMessages = messages.length > 0

  return (
    <div
      className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col transition-colors"
      style={{ height: hasMessages ? '280px' : undefined }}
    >
      {/* Message history */}
      {hasMessages && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-3 space-y-2 min-h-0">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-5 h-5 rounded-full bg-[#0d9488] flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              )}
              <div
                className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-snug whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#1e3a5f] text-white rounded-tr-sm'
                    : msg.isError
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-tl-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                }`}
              >
                {msg.isTyping ? <TypingDots /> : msg.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggestion chips — only show when no messages yet */}
      {!hasMessages && (
        <div className="px-5 pt-3 flex flex-wrap gap-2">
          {REFINEMENT_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => handleSend(chip)}
              disabled={isPending}
              className="px-3 py-1 text-xs rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#0d9488] hover:text-[#0d9488] dark:hover:text-[#0d9488] transition-colors disabled:opacity-40"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0">
        <div className="flex-shrink-0">
          <svg className="w-4 h-4 text-[#0d9488]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={
            hasMessages
              ? 'Continue refining…'
              : "Refine your diagram… e.g. 'Add an error handling path' or 'Convert to a swimlane with 3 roles'"
          }
          className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] placeholder:text-gray-400 dark:placeholder:text-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          disabled={isPending}
        />
        <button
          onClick={() => handleSend()}
          disabled={isPending || !input.trim()}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#0d9488] hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isPending ? (
            <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
          Refine
        </button>
      </div>
    </div>
  )
}
