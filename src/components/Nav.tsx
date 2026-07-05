import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Nav() {
  const { user, logout } = useAuth()

  return (
    <header className="border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between gap-4">

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 10L5.5 6L8 8.5L12 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-white tracking-tight">FloorTracker</span>
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
                 ${isActive ? 'text-white bg-zinc-800' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'}`
              }>
              {({ isActive }) => (
                <>
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-400 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-zinc-500 text-sm hidden sm:block truncate max-w-[120px]">{user?.name}</span>
          <button onClick={logout}
            className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800">
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
