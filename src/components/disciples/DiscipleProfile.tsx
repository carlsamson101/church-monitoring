import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, X, Clock, Minus } from 'lucide-react'
import { getDisciple } from '../../services/disciples'
import { getDiscipleAttendance } from '../../services/events'
import { getDiscipleRecords } from '../../services/checklists'
import type { AttendanceHistory, Disciple } from '../../types'
import { fmtDate } from '../../lib/format'
import { Badge, Empty, Spinner } from '../common/ui'

const Row = ({ k, v }: { k: string; v?: string | null }) => <div className="flex justify-between gap-4 py-2 text-sm"><span className="text-slate-500">{k}</span><span className="text-right">{v || '—'}</span></div>
const ICON = { present: <Check size={16} className="text-green-600" />, absent: <X size={16} className="text-red-600" />, late: <Clock size={16} className="text-amber-500" />, excused: <Minus size={16} className="text-slate-500" /> }

export default function DiscipleProfile() {
  const { id } = useParams(); const [d, setD] = useState<Disciple | null | undefined>(undefined); const [att, setAtt] = useState<AttendanceHistory[]>([]); const [recs, setRecs] = useState<{ date: string; completed: boolean; item: { name: string } | null }[]>([])
  useEffect(() => { if (id) { getDisciple(id).then(setD).catch(() => setD(null)); getDiscipleAttendance(id).then(setAtt).catch(() => setAtt([])); getDiscipleRecords(id).then(setRecs).catch(() => setRecs([])) } }, [id])
  if (d === undefined) return <Spinner />
  if (d === null) return <Empty text="Disciple not found, or you don't have access." />
  const counted = att.filter((a) => a.status !== 'excused'); const came = counted.filter((a) => a.status === 'present' || a.status === 'late').length
  const groupsMap = new Map<string, typeof recs>(); recs.forEach((r) => { const n = r.item?.name ?? 'Item'; groupsMap.set(n, [...(groupsMap.get(n) ?? []), r]) })
  const byItem = [...groupsMap.entries()]
  const rate = counted.length ? Math.round((came / counted.length) * 100) : null
  return (
    <div className="max-w-2xl space-y-4">
      <Link to="/disciples" className="inline-flex items-center gap-1 text-sm text-indigo-600"><ArrowLeft size={14} />Disciples</Link>
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">{d.first_name} {d.last_name}{d.nickname && <span className="text-slate-400"> “{d.nickname}”</span>}</h1><Badge v={d.status} /></div>
      <section className="divide-y rounded-xl bg-white px-4 shadow-sm">
        <Row k="Cell group" v={d.group?.name} /><Row k="Leader" v={d.leader ? `${d.leader.first_name} ${d.leader.last_name}` : null} />
        <Row k="Date joined" v={d.date_joined} /><Row k="Phone" v={d.phone} /><Row k="Email" v={d.email} /><Row k="Address" v={d.address} /><Row k="Notes" v={d.notes} />
      </section>
      <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between"><h2 className="font-medium">Attendance & events</h2>
          {rate !== null && <span className="text-sm text-slate-500">Attendance rate: <b className="text-slate-800">{rate}%</b> ({came} of {counted.length})</span>}</div>
        {att.length === 0 ? <p className="py-4 text-center text-sm text-slate-400">No attendance recorded yet.</p> : (
          <ol className="space-y-2 border-l-2 border-slate-100 pl-4">{att.map((a, i) => (
            <li key={i} className="relative flex items-center gap-2 text-sm"><span className="absolute -left-[1.4rem] rounded-full bg-white p-0.5">{ICON[a.status]}</span>
              <span className="w-28 shrink-0 text-slate-500">{fmtDate(a.event!.date)}</span><span>{a.event!.name}</span>
              {a.event!.type && <span className="rounded bg-indigo-50 px-1.5 text-xs text-indigo-700">{a.event!.type.name}</span>}
              <span className="ml-auto text-xs capitalize text-slate-400">{a.status}</span></li>))}</ol>)}
      </section>
      <section className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-medium">Checklist progress</h2>
        {byItem.length === 0 ? <p className="py-4 text-center text-sm text-slate-400">No checklist records yet.</p> : byItem.map(([name, rows]) => {
          const done = rows.filter((r) => r.completed).length; const pct = Math.round((done / rows.length) * 100)
          return (<div key={name} className="space-y-1"><div className="flex items-center justify-between text-sm"><span>{name}</span><span className="text-slate-500">{pct}% ({done}/{rows.length})</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} /></div>
            <div className="flex flex-wrap gap-1 pt-1">{rows.slice(0, 8).map((r, i) => <span key={i} title={fmtDate(r.date)} className={`rounded px-1.5 py-0.5 text-[11px] ${r.completed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.date.slice(5)} {r.completed ? '✓' : '✗'}</span>)}</div></div>)})}
      </section>
    </div>
  )
}
