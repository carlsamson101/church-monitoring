import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ACTIVE, KEY_TYPE, attendedCount, isAtt, loadBase, loadPeriod, pct, pickEvents, pickPeople, weekStart, type Base, type Filters, type Period } from '../../services/analytics'
import { today, weekRange } from '../../lib/format'
import { Field, Spinner, inputCls } from '../common/ui'
import { useToast } from '../common/Toast'

const Box = ({ title, children }: { title: string; children: ReactNode }) => (<section className="space-y-2 rounded-xl bg-white p-4 shadow-sm"><h2 className="font-medium">{title}</h2>{children}</section>)
const Empty = () => <p className="py-10 text-center text-sm text-slate-400">No data for these filters yet.</p>
const label = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
const Chart = ({ children }: { children: ReactNode }) => <div className="h-60 w-full"><ResponsiveContainer>{children as never}</ResponsiveContainer></div>

export default function AnalyticsPanels({ isStaff }: { isStaff: boolean }) {
  const toast = useToast(); const [base, setBase] = useState<Base | null>(null); const [week, setWeek] = useState<Period | null>(null); const [per, setPer] = useState<Period | null>(null)
  const [f, setF] = useState<Filters>({ from: weekRange(-7)[0], to: today(), group: '', leader: '', status: 'open', eventId: '' })
  const fail = (e: Error) => toast.push(e.message, 'error')
  useEffect(() => { const w = weekRange(0); Promise.all([loadBase(isStaff), loadPeriod(w[0], w[1])]).then(([b, p]) => { setBase(b); setWeek(p) }).catch(fail) }, [])
  useEffect(() => { setPer(null); loadPeriod(f.from, f.to).then(setPer).catch(fail) }, [f.from, f.to])
  const set = (k: keyof Filters) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const thisWeek = useMemo(() => {
    if (!base || !week) return []
    const active = base.disciples.filter((d) => ACTIVE.includes(d.status)); const ids = new Set(active.map((d) => d.id))
    const cards = base.types.filter((t) => KEY_TYPE.test(t.name)).map((t) => {
      const evs = week.events.filter((e) => e.event_type_id === t.id)
      const who = new Set(week.att.filter((a) => ids.has(a.disciple_id) && isAtt(a.status) && evs.some((e) => e.id === a.event_id)).map((a) => a.disciple_id))
      return { name: t.name, n: who.size, has: evs.length > 0 } })
    base.items.filter((i) => i.active && /discipleship/i.test(i.name)).forEach((i) => {
      const who = new Set(week.recs.filter((r) => r.checklist_item_id === i.id && r.completed && ids.has(r.disciple_id)).map((r) => r.disciple_id))
      cards.push({ name: i.name, n: who.size, has: true }) })
    return cards.map((c) => ({ ...c, total: active.length }))
  }, [base, week])

  const view = useMemo(() => {
    if (!base || !per) return null
    const people = pickPeople(base, f); const ids = new Set(people.map((d) => d.id)); const evs = pickEvents(per, f)
    const types = base.types.filter((t) => KEY_TYPE.test(t.name)).map((t) => {
      const te = evs.filter((e) => e.event_type_id === t.id); return { name: t.name, rate: pct(attendedCount(per, ids, new Set(te.map((e) => e.id))), te.length * ids.size), events: te.length } })
    const weeks = new Map<string, Set<string>>(); evs.forEach((e) => { const k = weekStart(e.date); weeks.set(k, (weeks.get(k) ?? new Set()).add(e.id)) })
    const trend = [...weeks.entries()].sort().map(([k, s]) => ({ name: label(k), Rate: pct(attendedCount(per, ids, s), s.size * ids.size) }))
    const perEvent = [...evs].sort((a, b) => a.date.localeCompare(b.date)).slice(-12).map((e) => { const got = attendedCount(per, ids, new Set([e.id])); return { name: `${e.name.slice(0, 12)} ${label(e.date)}`, Attended: got, Missed: Math.max(ids.size - got, 0) } })
    const agg = new Map<string, { d: number; t: number }>(); per.recs.filter((r) => ids.has(r.disciple_id)).forEach((r) => { const x = agg.get(r.checklist_item_id) ?? { d: 0, t: 0 }; x.t++; if (r.completed) x.d++; agg.set(r.checklist_item_id, x) })
    const checklist = [...agg.entries()].sort((a, b) => b[1].t - a[1].t).slice(0, 10).map(([id, x]) => ({ name: base.items.find((i) => i.id === id)?.name ?? '?', Completion: pct(x.d, x.t) ?? 0 }))
    return { types, trend, perEvent, checklist, people: people.length }
  }, [base, per, f])

  if (!base || !week) return <Spinner />
  return (
    <div className="space-y-4">
      {thisWeek.length > 0 && <div><h2 className="mb-2 font-medium">This week</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{thisWeek.map((c) => (
          <div key={c.name} className="rounded-xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">{c.name}</p>
            <p className="text-2xl font-semibold">{c.has ? c.n : '–'}<span className="text-base font-normal text-slate-400"> / {c.total}</span></p>{!c.has && <p className="text-xs text-slate-400">no event this week</p>}</div>))}</div></div>}
      <Box title="Filters">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-6">
          <Field label="From"><input type="date" className={inputCls} value={f.from} onChange={set('from')} /></Field>
          <Field label="To"><input type="date" className={inputCls} value={f.to} onChange={set('to')} /></Field>
          {isStaff && <Field label="Cell group"><select className={inputCls} value={f.group} onChange={set('group')}><option value="">All</option>{base.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>}
          {isStaff && <Field label="Leader"><select className={inputCls} value={f.leader} onChange={set('leader')}><option value="">All</option>{base.leaders.map((l) => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}</select></Field>}
          <Field label="Status"><select className={inputCls} value={f.status} onChange={set('status')}><option value="open">Active & new</option><option value="">All</option><option value="inactive">Inactive</option><option value="transferred">Transferred</option><option value="completed">Completed</option></select></Field>
          <Field label="Event"><select className={inputCls} value={f.eventId} onChange={set('eventId')}><option value="">All events</option>{(per?.events ?? []).map((e) => <option key={e.id} value={e.id}>{e.date} {e.name}</option>)}</select></Field>
        </div></Box>
      {!view ? <Spinner /> : (<>
        {view.types.length > 0 && <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{view.types.map((t) => (
          <div key={t.name} className="rounded-xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">{t.name} attendance</p><p className="text-2xl font-semibold">{t.rate === null ? '–' : `${t.rate}%`}</p><p className="text-xs text-slate-400">{t.events} event{t.events === 1 ? '' : 's'} · {view.people} disciples</p></div>))}</div>}
        <div className="grid gap-4 lg:grid-cols-2">
          <Box title="Attendance trend (weekly %)">{view.trend.length === 0 ? <Empty /> : <Chart><LineChart data={view.trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="Rate" stroke="#4f46e5" strokeWidth={2} connectNulls /></LineChart></Chart>}</Box>
          <Box title="Event attendance (latest 12)">{view.perEvent.length === 0 ? <Empty /> : <Chart><BarChart data={view.perEvent} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Bar dataKey="Attended" stackId="a" fill="#16a34a" /><Bar dataKey="Missed" stackId="a" fill="#fca5a5" /></BarChart></Chart>}</Box>
        </div>
        <Box title="Checklist completion (%)">{view.checklist.length === 0 ? <Empty /> : <Chart><BarChart data={view.checklist} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="Completion" fill="#f59e0b" radius={[4, 4, 0, 0]} /></BarChart></Chart>}</Box>
      </>)}
    </div>
  )
}
