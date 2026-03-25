const EXAMPLES = [
  'User registration and email verification flow',
  'E-commerce order processing from cart to delivery',
  'Employee onboarding process for a new hire',
  'Bug report triage and resolution workflow',
  'Customer support ticket escalation process',
]

export default function ExamplePrompts({ onSelect }) {
  return (
    <div>
      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 font-medium uppercase tracking-wide">
        Try an example
      </p>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            onClick={() => onSelect(example)}
            className="text-xs px-3 py-1.5 rounded-full border border-[#1e3a5f]/30 dark:border-[#0d9488]/50 text-[#1e3a5f] dark:text-[#0d9488] bg-white dark:bg-gray-700 hover:bg-[#1e3a5f] hover:text-white dark:hover:bg-[#0d9488] dark:hover:text-white transition-colors font-medium"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  )
}
