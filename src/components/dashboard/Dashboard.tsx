import { useEffect, useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../../hooks/useAuth'
import { countRows } from '../../services/profiles'
import { getDisciplesPerGroup, getTrend, type GroupTotal, type Period, type TrendPoint } from '../../services/stats'
import { Alert, Spinner } from '../common/ui'
import TrendChart from './TrendChart'
import AnalyticsPanels from './AnalyticsPanels'

const Card = ({ title, value, sub }: { title: string; value: number; sub?: string }) => (
  <div className="rounded-xl bg-white p-4 shadow-sm">
    <p className="text-sm text-slate-500">{title}</p><p className="text-2xl font-semibold">{value}</p>
    {sub && <p className="text-xs text-slate-400">{sub}</p>}
  </div>
)
const Panel = ({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) => (
  <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between"><h2 className="font-medium">{title}</h2>{right}</div>{children}
  </section>
)
const last = (t: TrendPoint[]) => t[t.length - 1] ?? { new_disciples: 0, new_invitees: 0 }

// Every number here comes from RLS-scoped queries: leaders see only their own group,
// pastors/developer see the whole church.
export default function Dashboard() {
  const { profile } = useAuth()
  const isStaff = profile?.role !== 'leader'
  const [period, setPeriod] = useState<Period>('week')
  const [totals, setTotals] = useState<Record<string, number> | null>(null)
  const [weekly, setWeekly] = useState<TrendPoint[]>([])
  const [monthly, setMonthly] = useState<TrendPoint[]>([])
  const [groups, setGroups] = useState<GroupTotal[]>([])
  const [err, setErr] = useState('')

  useEffect(() => {
    Promise.all([
      countRows('cell_groups'), countRows('disciples'), countRows('invitees'), countRows('disciples', ['status', 'active']), countRows('disciples', ['status', 'inactive']), isStaff ? countRows('profiles', ['role', 'leader']) : Promise.resolve(0),
      getTrend('week', 12), getTrend('month', 12), isStaff ? getDisciplesPerGroup() : Promise.resolve([]),
    ]).then(([g, d, i, a, ina, ld, w, m, pg]) => {
      setTotals(isStaff ? { Leaders: ld, 'Cell Groups': g, Disciples: d, Invitees: i, 'Active Disciples': a, 'Inactive Disciples': ina } : { 'My Groups': g, Disciples: d, Invitees: i, 'Active Disciples': a })
      setWeekly(w); setMonthly(m); setGroups(pg)
    }).catch((e) => setErr(e.message))
  }, [isStaff])

  if (err) return <Alert kind="error">{err}</Alert>
  if (!totals) return <Spinner />
  const w = last(weekly), m = last(monthly)
  const toggle = (
    <div className="flex rounded-lg bg-slate-100 p-0.5 text-sm">
      {(['week', 'month'] as Period[]).map((p) => (
        <button key={p} onClick={() => setPeriod(p)} className={`rounded-md px-3 py-1 ${period === p ? 'bg-white shadow-sm' : 'text-slate-500'}`}>{p === 'week' ? 'Weekly' : 'Monthly'}</button>
      ))}
    </div>
  )
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Welcome, {profile?.first_name || 'friend'}</h1>
        <p className="text-sm text-slate-500">{isStaff ? 'Church-wide overview' : 'Your cell group overview'}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {Object.entries(totals).map(([k, v]) => <Card key={k} title={k} value={v} />)}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card title="New disciples" value={w.new_disciples} sub="this week" />
        <Card title="New disciples" value={m.new_disciples} sub="this month" />
        <Card title="New invitees" value={w.new_invitees} sub="this week" />
        <Card title="New invitees" value={m.new_invitees} sub="this month" />
      </div>
      <Panel title={`New disciples & invitees (${period === 'week' ? 'last 12 weeks' : 'last 12 months'})`} right={toggle}>
        <TrendChart data={period === 'week' ? weekly : monthly} period={period} />
      </Panel>
      {isStaff && (
        <Panel title="Disciples per cell group">
          {groups.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">No cell groups yet.</p> : (
            <div className="h-64 w-full"><ResponsiveContainer>
              <BarChart data={groups} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="group_name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip /><Bar dataKey="total" name="Disciples" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></div>
          )}
        </Panel>
      )}
      <AnalyticsPanels isStaff={isStaff} />
    </div>
  )
}
