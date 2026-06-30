import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Nav() {
  const { user, logout } = useAuth()

  const link = 'px-3 py-1.5 rounded-md text-sm font-medium transition-colors'
  const active = 'bg-emerald-600 text-white'
  const inactive = 'text-gray-400 hover:text-white hover:bg-gray-800'

  return (
    <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-sm font-bold text-white">F</span>
          <span className="font-bold text-white">FloorTracker</span>
        </div>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={({ isActive }) => `${link} ${isActive ? active : inactive}`}>Today</NavLink>
          <NavLink to="/history" className={({ isActive }) => `${link} ${isActive ? active : inactive}`}>History</NavLink>
          {user?.role === 'manager' && (
            <NavLink to="/team" className={({ isActive }) => `${link} ${isActive ? active : inactive}`}>Team</NavLink>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-sm hidden sm:block">{user?.name}</span>
          <button onClick={logout} className="text-xs text-gray-500 hover:text-white transition-colors">Sign out</button>
        </div>
      </div>
    </header>
  )
}
