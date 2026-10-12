import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getEvent, getEventAttendance, saveAttendance } from '../../services/events'
import { listDisciples } from '../../services/disciples'
import { listGroups } from '../../services/cellGroups'
import type { AttStatus, CellGroup, ChurchEvent, Disciple } from '../../types'
import { fmtDate } from '../../lib/format'
import { Empty, Spinner, inputCls } from '../common/ui'
import { useToast } from '../common/Toast'

const OPTS: { s: AttStatus; label: string; on: string }[] = [
  { s: 'present', label: 'Present', on: 'bg-green-600 text-white' }, { s: 'absent', label: 'Absent', on: 'bg-red-600 text-white' },
  { s: 'late', label: 'Late', on: 'bg-amber-500 text-white' }, { s: 'excused', label: 'Excused', on: 'bg-slate-600 text-white' },
]
const ACTIVE = ['new_disciple', 'active']

export default function AttendancePage() {
  const { id } = useParams(); const { profile } = useAuth(); const toast = useToast(); const isStaff = profile?.role !== 'leader'
  const [ev, setEv] = useState<ChurchEvent | null | undefined>(undefined); const [people, setPeople] = useState<Disciple[]>([]); const [groups, setGroups] = useState<CellGroup[]>([])
  const [saved, setSaved] = useState<Record<string, AttStatus>>({}); const [marks, setMarks] = useState<Record<string, AttStatus>>({})
  const [group, setGroup] = useState(''); const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([getEvent(id), listDisciples(), getEventAttendance(id), listGroups()]).then(([e, d, a, g]) => {
      setEv(e); setPeople(d.filter((x) => ACTIVE.includes(x.status))); setSaved(a); setMarks(a); setGroups(g)
    }).catch((e) => { toast.push(e.message, 'error'); setEv(null) })
  }, [id])

  if (ev === undefined) return <Spinner />
  if (ev === null) return <Empty text="Event not found." />
  const shown = people.filter((p) => !group || p.cell_group_id === group)
  const dirty = Object.keys(marks).filter((k) => marks[k] !== saved[k])
  const count = (s: AttStatus) => shown.filter((p) => marks[p.id] === s).length
  const set = (pid: string, s: AttStatus) => setMarks((m) => ({ ...m, [pid]: s }))
  const save = async () => {
    if (!id || !profile) return; setBusy(true)
    try { await saveAttendance(id, dirty.map((k) => ({ disciple_id: k, status: marks[k] })), profile.id); setSaved(marks); toast.push(`Saved ${dirty.length} record${dirty.length === 1 ? '' : 's'}`) }
    catch (e) { toast.push((e as Error).message, 'error') } finally { setBusy(false) }
  }
  return (
    <div className="max-w-3xl space-y-4 pb-16">
      <Link to="/events" className="inline-flex items-center gap-1 text-sm text-indigo-600"><ArrowLeft size={14} />Events</Link>
      <div><h1 className="text-xl font-semibold">{ev.name}</h1><p className="text-sm text-slate-500">{ev.type?.name} · {fmtDate(ev.date)}{ev.location && ` · ${ev.location}`}</p></div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {OPTS.map((o) => <span key={o.s} className="rounded-full bg-white px-3 py-1 shadow-sm">{o.label}: <b>{count(o.s)}</b></span>)}
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">Unmarked: <b>{shown.length - OPTS.reduce((n, o) => n + count(o.s), 0)}</b></span>
      </div>
      <div className="flex flex-wrap gap-2">
        {isStaff && <select className={`${inputCls} w-auto`} value={group} onChange={(e) => setGroup(e.target.value)}><option value="">All groups</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>}
        <button className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50" onClick={() => setMarks((m) => ({ ...m, ...Object.fromEntries(shown.map((p) => [p.id, 'present' as AttStatus])) }))}>Mark all present</button>
      </div>
      {shown.length === 0 ? <Empty text="No active disciples to record." /> : (
        <div className="divide-y rounded-xl bg-white shadow-sm">{shown.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div className="min-w-0"><p className="font-medium">{p.first_name} {p.last_name}</p>{isStaff && <p className="text-xs text-slate-400">{p.group?.name}</p>}</div>
            <div className="flex gap-1">{OPTS.map((o) => (
              <button key={o.s} onClick={() => set(p.id, o.s)} className={`rounded-md px-2.5 py-1.5 text-xs ${marks[p.id] === o.s ? o.on : 'bg-slate-100 text-slate-600'}`}>{o.label}</button>))}</div>
          </div>))}</div>
      )}
      {dirty.length > 0 && (
        <button onClick={save} disabled={busy} className="fixed bottom-20 right-4 z-20 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-lg disabled:opacity-50 md:bottom-6">
          <Save size={16} />Save {dirty.length} change{dirty.length === 1 ? '' : 's'}</button>
      )}
    </div>
  )
}
