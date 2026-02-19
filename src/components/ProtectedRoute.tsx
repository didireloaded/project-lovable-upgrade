import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
          <span className="font-display text-sm text-muted-foreground tracking-wider uppercase">Loading…</span>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  return <>{children}</>
}
