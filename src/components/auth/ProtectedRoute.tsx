import { Navigate, Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { signOut } from '../../services/auth'
import { Spinner } from '../common/ui'
import type { Role } from '../../types'

function Blocked({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-sm space-y-3 rounded-2xl bg-white p-6 text-center shadow">
        <h1 className="text-lg font-semibold">{title}</h1><p className="text-sm text-slate-600">{text}</p>
        <button onClick={signOut} className="inline-flex items-center gap-1 text-sm text-indigo-600"><LogOut size={14} />Sign out</button>
      </div>
    </div>
  )
}

// UI-level guard only. The real enforcement is Row Level Security in the database.
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { session, profile, loading, error } = useAuth()
  if (loading) return <Spinner />
  if (!session) return <Navigate to="/login" replace />
  if (error || !profile) return <Blocked title="Profile unavailable" text={error ?? 'No profile found for this account.'} />
  if (profile.status === 'pending') return <Blocked title="Awaiting approval" text="Your leader account is waiting for a Pastor to approve it." />
  if (profile.status === 'inactive') return <Blocked title="Account inactive" text="Please contact your pastor." />
  if (roles && !roles.includes(profile.role)) return <Navigate to="/" replace />
  return <Outlet />
}
