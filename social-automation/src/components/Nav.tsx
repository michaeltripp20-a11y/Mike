export type Tab = 'dashboard' | 'composer' | 'calendar' | 'queue' | 'settings'

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'composer', label: 'Composer' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'queue', label: 'Queue' },
  { id: 'settings', label: 'Settings' },
]

export function Nav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            active === t.id
              ? 'bg-emerald-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  )
}
