import { useEffect, useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getAttendanceRange, getRecordsRange, listItems, type AttRow } from '../../services/checklists'
import { listEvents, listEventTypes } from '../../services/events'
import { listDisciples } from '../../services/disciples'
import { listGroups } from '../../services/cellGroups'
import type { CellGroup, ChecklistItem, ChecklistRecord, ChurchEvent, Disciple, EventType } from '../../types'
import { fmtDate, monthRange, weekRange } from '../../lib/format'
import { Empty, Spinner, inputCls } from '../common/ui'
import { useToast } from '../common/Toast'

type Cnt = { got: number; total: number }
const PERIODS = { week: ['This week', () => weekRange(0)], lastweek: ['Last week', () => weekRange(-1)], month: ['This month', () => monthRange(0)], lastmonth: ['Last month', () => monthRange(-1)] } as const
type PKey = keyof typeof PERIODS

function Mark({ c }: { c: Cnt }) {
  if (c.total === 0) return <span className="text-slate-300">–</span>
  if (c.total === 1) return c.got ? <Check size={18} className="mx-auto text-green-600" /> : <X size={18} className="mx-auto text-red-500" />
  const cls = c.got === c.total ? 'text-green-600' : c.got === 0 ? 'text-red-500' : 'text-amber-600'
  return <span className={`text-sm font-medium ${cls}`}>{c.got}/{c.total}</span>
}

export default function MonitoringPage() {
  const { profile } = useAuth(); const toast = useToast(); const isStaff = profile?.role !== 'leader'
  const [period, setPeriod] = useState<PKey>('week'); const [group, setGroup] = useState('')
  const [base, setBase] = useState<{ types: EventType[]; items: ChecklistItem[]; people: Disciple[]; groups: CellGroup[] } | null>(null)
  const [data, setData] = useState<{ events: ChurchEvent[]; att: AttRow[]; recs: ChecklistRecord[] } | null>(null)
  const [cols, setCols] = useState<string[] | null>(null)
  const [from, to] = PERIODS[period][1]()

  useEffect(() => { Promise.all([listEventTypes(), listItems(), listDisciples(), listGroups()]).then(([types, items, d, groups]) => {
    const act = items.filter((i) => i.active)
    const pick = [...types.filter((t) => /sunday|fellowship|training|encounter/i.test(t.name)).map((t) => `e:${t.id}`), ...act.filter((i) => /discipleship/i.test(i.name)).map((i) => `c:${i.id}`)]
    setCols(pick.length ? pick : [...types.slice(0, 3).map((t) => `e:${t.id}`), ...act.slice(0, 2).map((i) => `c:${i.id}`)])
    setBase({ types, items: act, people: d.filter((x) => ['new_disciple', 'active'].includes(x.status)), groups })
  }).catch((e) => toast.push(e.message, 'error')) }, [])
  useEffect(() => { setData(null); Promise.all([listEvents(), getAttendanceRange(from, to), getRecordsRange(from, to)])
    .then(([events, att, recs]) => setData({ events: events.filter((e) => e.date >= from && e.date <= to && e.status !== 'cancelled'), att, recs })).catch((e) => toast.push(e.message, 'error')) }, [from, to])

  const view = useMemo(() => {
    if (!base || !data || !cols) return null
    const map = new Map<string, Cnt>(); const bump = (k: string, got: boolean) => { const c = map.get(k) ?? { got: 0, total: 0 }; c.total++; if (got) c.got++; map.set(k, c) }
    const evTotal = (typeId: string) => data.events.filter((e) => e.event_type_id === typeId).length
    for (const a of data.att) if (a.events.status !== 'cancelled' && a.events.event_type_id) { const k = `${a.disciple_id}|e:${a.events.event_type_id}`; const c = map.get(k) ?? { got: 0, total: 0 }; if (a.status === 'present' || a.status === 'late') c.got++; map.set(k, c) }
    for (const r of data.recs) bump(`${r.disciple_id}|c:${r.checklist_item_id}`, r.completed)
    const get = (did: string, col: string): Cnt => { const c = map.get(`${did}|${col}`) ?? { got: 0, total: 0 }; return col.startsWith('e:') ? { got: c.got, total: evTotal(col.slice(2)) } : c }
    const people = base.people.filter((p) => !group || p.cell_group_id === group)
    const label = (col: string) => col.startsWith('e:') ? base.types.find((t) => t.id === col.slice(2))?.name ?? '?' : base.items.find((i) => i.id === col.slice(2))?.name ?? '?'
    const pct = (col: string) => { let g = 0, t = 0; people.forEach((p) => { const c = get(p.id, col); g += c.got; t += c.total }); return t ? Math.round((g / t) * 100) : null }
    return { people, get, label, pct }
  }, [base, data, cols, group])

  if (!base || !cols) return <Spinner />
  const toggle = (k: string) => setCols(cols.includes(k) ? cols.filter((c) => c !== k) : [...cols, k])
  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-semibold">{isStaff ? 'Group monitoring' : 'My group monitoring'}</h1><p className="text-sm text-slate-500">{fmtDate(from)} – {fmtDate(to)}</p></div>
      <div className="flex flex-wrap items-start gap-2">
        <select className={`${inputCls} w-auto`} value={period} onChange={(e) => setPeriod(e.target.value as PKey)}>{(Object.keys(PERIODS) as PKey[]).map((k) => <option key={k} value={k}>{PERIODS[k][0]}</option>)}</select>
        {isStaff && <select className={`${inputCls} w-auto`} value={group} onChange={(e) => setGroup(e.target.value)}><option value="">All groups</option>{base.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>}
        <details className="rounded-lg border bg-white px-3 py-2 text-sm"><summary className="cursor-pointer">Columns ({cols.length})</summary>
          <div className="mt-2 max-h-56 space-y-1 overflow-auto">
            {base.types.map((t) => <label key={t.id} className="flex items-center gap-2"><input type="checkbox" checked={cols.includes(`e:${t.id}`)} onChange={() => toggle(`e:${t.id}`)} />{t.name} <span className="text-xs text-slate-400">event</span></label>)}
            {base.items.map((i) => <label key={i.id} className="flex items-center gap-2"><input type="checkbox" checked={cols.includes(`c:${i.id}`)} onChange={() => toggle(`c:${i.id}`)} />{i.name} <span className="text-xs text-slate-400">checklist</span></label>)}</div></details>
      </div>
      {!view ? <Spinner /> : cols.length === 0 ? <Empty text="Choose at least one column." /> : view.people.length === 0 ? <Empty text="No active disciples to monitor." /> : (<>
        <div className="hidden overflow-x-auto rounded-xl bg-white shadow-sm md:block">
          <table className="w-full text-center text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-3 text-left uppercase">Disciple</th>
            {cols.map((c) => <th key={c} className="p-3 font-medium uppercase">{view.label(c)}<div className="font-normal normal-case text-slate-400">{view.pct(c) === null ? '–' : `${view.pct(c)}%`}</div></th>)}</tr></thead>
            <tbody className="divide-y">{view.people.map((p) => <tr key={p.id}><td className="p-3 text-left font-medium">{p.first_name} {p.last_name}</td>{cols.map((c) => <td key={c} className="p-3"><Mark c={view.get(p.id, c)} /></td>)}</tr>)}</tbody></table>
        </div>
        <div className="space-y-2 md:hidden">{view.people.map((p) => (
          <div key={p.id} className="rounded-xl bg-white p-4 shadow-sm"><p className="mb-2 font-medium">{p.first_name} {p.last_name}</p>
            <div className="space-y-1">{cols.map((c) => <div key={c} className="flex items-center justify-between text-sm"><span className="text-slate-600">{view.label(c)}</span><Mark c={view.get(p.id, c)} /></div>)}</div></div>))}</div>
        <p className="text-xs text-slate-400">✓/✗ = one event or record in the period; x/y = completed out of total. Event columns count events in the period that were not cancelled, so unrecorded attendance shows as missed.</p>
      </>)}
    </div>
  )
}
