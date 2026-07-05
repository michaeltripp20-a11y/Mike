import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth'
import Login from './pages/Login'
import Today from './pages/Today'
import History from './pages/History'
import TeamBoard from './pages/TeamBoard'
import CoachingForm from './pages/CoachingForm'
import Nav from './components/Nav'

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Nav />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Today /></RequireAuth>} />
        <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
        <Route path="/team" element={<RequireAuth><TeamBoard /></RequireAuth>} />
        <Route path="/coach/:leaderId" element={<RequireAuth><CoachingForm /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
