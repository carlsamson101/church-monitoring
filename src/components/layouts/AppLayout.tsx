import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, UserPlus, CalendarDays, BarChart3, Network, Code2, LogOut, UserCheck, ListChecks, ClipboardList, Table2, MoreHorizontal } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { signOut } from '../../services/auth'
import type { Role } from '../../types'

const CHURCH_NAME = 'Command Center Christian Church'
// Vite serves everything in /public from the site root
const LOGO_SRC = '/assets/cccclogo.jpg'

const ALL: Role[] = ['developer', 'pastor', 'leader']; const STAFF: Role[] = ['developer', 'pastor']
const NAV: { to: string; label: string; icon: typeof Users; roles: Role[] }[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ALL },
  { to: '/monitoring', label: 'Monitoring', icon: Table2, roles: ALL },
  { to: '/record', label: 'Record', icon: ClipboardList, roles: ALL },
  { to: '/disciples', label: 'Disciples', icon: Users, roles: ALL },
  { to: '/invitees', label: 'Invitees', icon: UserPlus, roles: ALL },
  { to: '/events', label: 'Events', icon: CalendarDays, roles: ALL },
  { to: '/cell-groups', label: 'Groups', icon: Network, roles: ALL },
  { to: '/leaders', label: 'Leaders', icon: UserCheck, roles: STAFF },
  { to: '/checklists', label: 'Checklists', icon: ListChecks, roles: STAFF },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: STAFF },
  { to: '/developer', label: 'Developer', icon: Code2, roles: ['developer'] },
]

function Brand({ size }: { size: 'sm' | 'md' }) {
  const img = size === 'md' ? 'h-10 w-10' : 'h-8 w-8'
  const text = size === 'md' ? 'text-sm' : 'text-sm'
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <img src={LOGO_SRC} alt={`${CHURCH_NAME} logo`} className={`${img} shrink-0 rounded-md object-contain`} />
      <span className={`${text} font-semibold leading-tight text-green-800`}>{CHURCH_NAME}</span>
    </span>
  )
}

export default function AppLayout() {
  const { profile } = useAuth(); const [more, setMore] = useState(false)
  const items = NAV.filter((n) => profile && n.roles.includes(profile.role))
  const main = items.slice(0, 4); const rest = items.slice(4)
  const link = (active: boolean) => (active ? 'text-green-800 bg-green-100 font-medium' : 'text-slate-600 hover:bg-green-50 hover:text-green-800')
  return (
    <div className="min-h-screen md:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-green-100 bg-white p-4 md:flex">
        <div className="mb-6 border-b border-green-100 pb-4"><Brand size="md" /></div>
        <nav className="flex-1 space-y-1 overflow-auto">
          {items.map(({ to, label, icon: I }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${link(isActive)}`}><I size={18} />{label}</NavLink>))}
        </nav>
        <div className="border-t border-green-100 pt-3 text-sm">
          <p className="font-medium">{profile?.first_name} {profile?.last_name}</p><p className="mb-2 capitalize text-slate-500">{profile?.role}</p>
          <button onClick={signOut} className="flex items-center gap-1 text-slate-600 hover:text-red-600"><LogOut size={14} />Sign out</button>
        </div>
      </aside>
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-green-100 bg-white px-4 py-2.5 md:hidden">
        <Brand size="sm" />
        <button onClick={signOut} aria-label="Sign out" className="shrink-0 text-slate-600"><LogOut size={18} /></button>
      </header>
      <main className="p-4 pb-24 md:p-8"><Outlet /></main>
      {more && <div className="fixed inset-0 z-20 md:hidden" onClick={() => setMore(false)}>
        <div className="absolute inset-x-3 bottom-20 space-y-1 rounded-2xl bg-white p-2 shadow-xl" onClick={(e) => e.stopPropagation()}>
          {rest.map(({ to, label, icon: I }) => <NavLink key={to} to={to} onClick={() => setMore(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${link(isActive)}`}><I size={18} />{label}</NavLink>)}
        </div></div>}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-green-100 bg-white py-1 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {main.map(({ to, label, icon: I }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex flex-col items-center rounded-lg px-3 py-1 text-[11px] ${link(isActive)}`}><I size={20} />{label}</NavLink>))}
        {rest.length > 0 && <button onClick={() => setMore(!more)} className="flex flex-col items-center rounded-lg px-3 py-1 text-[11px] text-slate-600"><MoreHorizontal size={20} />More</button>}
      </nav>
    </div>
  )
}