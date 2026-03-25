import { useEffect, useState } from 'react'
import { exportToConfluence } from '../utils/generateDiagram'

export default function ConfluenceModal({ isOpen, onClose, nodes, edges, diagramTitle }) {
  const [form, setForm] = useState({
    baseUrl: '',
    email: '',
    apiToken: '',
    spaceKey: '',
    pageTitle: diagramTitle || 'My Diagram',
    parentPage: '',
  })
  const [status, setStatus] = useState(null)  // null | 'loading' | { success, pageUrl } | { error }
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!isOpen) {
      setStatus(null)
      setErrors({})
    }
  }, [isOpen])

  useEffect(() => {
    setForm(f => ({ ...f, pageTitle: diagramTitle || 'My Diagram' }))
  }, [diagramTitle])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  function validate() {
    const e = {}
    if (!form.baseUrl.trim()) e.baseUrl = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    if (!form.apiToken.trim()) e.apiToken = 'Required'
    if (!form.spaceKey.trim()) e.spaceKey = 'Required'
    if (!form.pageTitle.trim()) e.pageTitle = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleExport() {
    if (!validate()) return
    setStatus('loading')
    try {
      const result = await exportToConfluence({ ...form, nodes, edges })
      setStatus({ success: true, pageUrl: result.pageUrl })
    } catch (err) {
      setStatus({ error: err.message || 'Export failed. Check your credentials and try again.' })
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>☁️</span> Export to Confluence
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
              Your diagram will be embedded as a live, editable draw.io diagram on the page.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success state */}
        {status?.success && (
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Page updated in Confluence</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your diagram is now live and editable.</p>
            </div>
            {status.pageUrl && (
              <a
                href={status.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1e3a5f] hover:bg-blue-900 rounded-lg transition-colors"
              >
                Open page →
              </a>
            )}
            <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 underline">Close</button>
          </div>
        )}

        {/* Error state */}
        {status?.error && (
          <div className="px-6 pt-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
              {status.error}
            </div>
          </div>
        )}

        {/* Form */}
        {!status?.success && (
          <div className="p-6 space-y-4">
            <Field label="Confluence Base URL" placeholder="https://yoursite.atlassian.net" value={form.baseUrl} onChange={set('baseUrl')} error={errors.baseUrl} hint="No trailing slash" />
            <Field label="Email" placeholder="you@company.com" value={form.email} onChange={set('email')} error={errors.email} />
            <Field label="API Token" placeholder="Your Atlassian API token" value={form.apiToken} onChange={set('apiToken')} error={errors.apiToken} type="password" hint={<a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="underline">Get API token ↗</a>} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Space Key" placeholder="ENG" value={form.spaceKey} onChange={set('spaceKey')} error={errors.spaceKey} />
              <Field label="Parent Page (optional)" placeholder="Engineering Docs" value={form.parentPage} onChange={set('parentPage')} />
            </div>
            <Field label="Page Title" placeholder="My Diagram" value={form.pageTitle} onChange={set('pageTitle')} error={errors.pageTitle} />

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={status === 'loading'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1e3a5f] hover:bg-blue-900 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Exporting…</>
                ) : 'Export to Confluence'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, error, type = 'text', hint }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 ${
          error ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  )
}
