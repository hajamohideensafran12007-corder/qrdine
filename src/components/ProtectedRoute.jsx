import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-700 border-t-transparent
                          rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/admin/login" replace />

  return children
}