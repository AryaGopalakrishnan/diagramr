import { useState, useEffect } from 'react'

const STORAGE_KEY = 'diagramr_api_key'

export default function ApiKeyModal({ isOpen, onClose }) {
  const [input, setInput] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setInput(localStorage.getItem(STORAGE_KEY) || '')
      setSaved(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  function handleSave() {
    const trimmed = input.trim()
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    setSaved(true)
    setTimeout(onClose, 800)
  }

  function handleRemove() {
    localStorage.removeItem(STORAGE_KEY)
    setInput('')
    setSaved(false)
  }

  if (!isOpen) return null

  const maskedKey = input.length > 12
    ? input.slice(0, 8) + '••••••••' + input.slice(-4)
    : input

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Anthropic API Key</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Stored locally in your browser only</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Your API Key
            </label>
            <input
              type="password"
              value={input}
              onChange={(e) => { setInput(e.target.value); setSaved(false) }}
              placeholder="sk-ant-api03-..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 font-mono"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
            />
            {input.length > 12 && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 font-mono">{maskedKey}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2 text-sm font-semibold text-white bg-[#1e3a5f] hover:bg-blue-900 rounded-lg transition-colors"
            >
              {saved ? '✓ Saved' : 'Save Key'}
            </button>
            {input && (
              <button
                onClick={handleRemove}
                className="px-3 py-2 text-sm text-red-500 hover:text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Remove
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
            Get your free key at{' '}
            <a
              href="https://console.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0d9488] hover:underline"
            >
              console.anthropic.com
            </a>
            . Your key is never sent to our servers — it goes directly to Anthropic.
          </p>
        </div>
      </div>
    </div>
  )
}

export function getStoredApiKey() {
  return localStorage.getItem(STORAGE_KEY) || ''
}
