import { useEffect, useState, useCallback } from 'react'
import { extractJiraTasks, createJiraTickets } from '../utils/generateDiagram'

const ISSUE_TYPES = ['Task', 'Story', 'Bug']
const PRIORITY_COLORS = {
  High:   'text-red-600 dark:text-red-400',
  Medium: 'text-yellow-600 dark:text-yellow-400',
  Low:    'text-green-600 dark:text-green-400',
}

export default function JiraModal({ isOpen, onClose, nodes, edges }) {
  const [step, setStep] = useState('config')   // 'config' | 'tasks' | 'done'
  const [form, setForm] = useState({ baseUrl: '', email: '', apiToken: '', projectKey: '' })
  const [formErrors, setFormErrors] = useState({})
  const [tasks, setTasks] = useState([])
  const [checked, setChecked] = useState({})
  const [isExtracting, setIsExtracting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [result, setResult] = useState(null)
  const [extractError, setExtractError] = useState(null)

  useEffect(() => {
    if (!isOpen) {
      setStep('config')
      setTasks([])
      setChecked({})
      setResult(null)
      setExtractError(null)
      setFormErrors({})
    }
  }, [isOpen])

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
    if (!form.projectKey.trim()) e.projectKey = 'Required'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleExtract() {
    if (!validate()) return
    setIsExtracting(true)
    setExtractError(null)
    try {
      const extracted = await extractJiraTasks(nodes, edges)
      setTasks(extracted)
      const initChecked = {}
      extracted.forEach((t) => { initChecked[t.nodeId] = true })
      setChecked(initChecked)
      setStep('tasks')
    } catch (err) {
      setExtractError(err.message || 'Failed to extract tasks.')
    } finally {
      setIsExtracting(false)
    }
  }

  const updateTaskType = useCallback((nodeId, issue_type) => {
    setTasks(ts => ts.map(t => t.nodeId === nodeId ? { ...t, issue_type } : t))
  }, [])

  const selectedTasks = tasks.filter(t => checked[t.nodeId])

  async function handleCreate() {
    if (selectedTasks.length === 0) return
    setIsCreating(true)
    try {
      const res = await createJiraTickets({ ...form, tasks: selectedTasks })
      setResult(res)
      setStep('done')
    } catch (err) {
      setResult({ error: err.message })
      setStep('done')
    } finally {
      setIsCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🎫</span>
              {step === 'tasks'
                ? `We found ${tasks.length} potential task${tasks.length !== 1 ? 's' : ''} in your diagram.`
                : step === 'done' ? 'Done!' : 'Create Jira Tickets'}
            </h2>
            {step === 'tasks' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select which ones to create as Jira tickets.</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step: config */}
        {step === 'config' && (
          <div className="p-6 space-y-4 overflow-y-auto">
            <Field label="Jira Base URL" placeholder="https://yoursite.atlassian.net" value={form.baseUrl} onChange={set('baseUrl')} error={formErrors.baseUrl} />
            <Field label="Email" placeholder="you@company.com" value={form.email} onChange={set('email')} error={formErrors.email} />
            <Field label="API Token" placeholder="Your Atlassian API token" value={form.apiToken} onChange={set('apiToken')} error={formErrors.apiToken} type="password" hint={<a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="underline">Get API token ↗</a>} />
            <Field label="Project Key" placeholder="ENG" value={form.projectKey} onChange={set('projectKey')} error={formErrors.projectKey} hint="The short key for your Jira project (e.g. ENG, DEV)" />

            {extractError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
                {extractError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                onClick={handleExtract}
                disabled={isExtracting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1e3a5f] hover:bg-blue-900 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isExtracting
                  ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Extracting tasks…</>
                  : 'Extract Tasks from Diagram'}
              </button>
            </div>
          </div>
        )}

        {/* Step: tasks */}
        {step === 'tasks' && (
          <>
            <div className="overflow-y-auto flex-1 p-6 space-y-2">
              {tasks.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No actionable tasks found in this diagram.</p>
              )}
              {tasks.map((task) => (
                <div
                  key={task.nodeId}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                    checked[task.nodeId]
                      ? 'border-[#0d9488] bg-teal-50/50 dark:bg-teal-900/10'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!checked[task.nodeId]}
                    onChange={(e) => setChecked(c => ({ ...c, [task.nodeId]: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-[#0d9488] flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900 dark:text-white truncate">{task.summary}</span>
                      <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority] || ''}`}>{task.priority}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{task.description}</p>
                    {/* Issue type selector */}
                    <select
                      value={task.issue_type || task.suggested_type || 'Task'}
                      onChange={(e) => updateTaskType(task.nodeId, e.target.value)}
                      className="mt-1.5 px-2 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                      {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex gap-3">
              <button onClick={() => setStep('config')} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                ← Back
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating || selectedTasks.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#1e3a5f] hover:bg-blue-900 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCreating
                  ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Creating…</>
                  : `Create ${selectedTasks.length} ticket${selectedTasks.length !== 1 ? 's' : ''} in Jira`}
              </button>
            </div>
          </>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            {result?.error ? (
              <>
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Created {result?.created?.length || 0} Jira ticket{result?.created?.length !== 1 ? 's' : ''}
                  </p>
                  {result?.errors?.length > 0 && (
                    <p className="text-xs text-red-500 mt-1">{result.errors.length} failed to create.</p>
                  )}
                </div>
                {result?.projectUrl && (
                  <a href={result.projectUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1e3a5f] hover:bg-blue-900 rounded-lg transition-colors">
                    View in Jira →
                  </a>
                )}
              </>
            )}
            <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 underline">Close</button>
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
