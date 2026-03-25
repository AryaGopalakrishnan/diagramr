export default function ExportToolbar({ hasNodes, onConfluence, onJira }) {
  return (
    <div className="flex items-center gap-2 px-5 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">Export to:</span>

      <button
        onClick={onConfluence}
        disabled={!hasNodes}
        title={hasNodes ? 'Export diagram to Confluence' : 'Generate a diagram first'}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 border border-gray-200 dark:border-gray-600"
      >
        ☁️ Confluence
      </button>

      <button
        onClick={onJira}
        disabled={!hasNodes}
        title={hasNodes ? 'Create Jira tickets from diagram nodes' : 'Generate a diagram first'}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300 border border-gray-200 dark:border-gray-600"
      >
        🎫 Jira Tickets
      </button>
    </div>
  )
}
