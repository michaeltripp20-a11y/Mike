import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Nav() {
  const { user, logout } = useAuth()

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
      <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between gap-4">

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 10L5.5 6L8 8.5L12 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-gray-900 tracking-tight">FloorTracker</span>
        </div>

        <nav className="flex items-center gap-0.5">
          {[
            { to: '/', label: 'Today', end: true },
            { to: '/history', label: 'History', end: false },
            ...(user?.role === 'manager' ? [{ to: '/team', label: 'Team', end: false }] : []),
          ].map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `relative px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors
                 ${isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`
              }>
              {({ isActive }) => (
                <>
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-500 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-gray-400 text-sm hidden sm:block truncate max-w-[120px]">{user?.name}</span>
          <button onClick={logout}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
