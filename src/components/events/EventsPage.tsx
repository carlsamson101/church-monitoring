import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ClipboardCheck, MapPin, Plus, Tags } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { addEventType, listEvents, listEventTypes, saveEvent } from '../../services/events'
import type { ChurchEvent, EventType } from '../../types'
import { fmtDate, fmtTime, today } from '../../lib/format'
import { Badge, Empty, Field, Spinner, btnCls, btnPrimarySm, btnSm, inputCls, nz } from '../common/ui'
import { Modal } from '../common/Modal'
import { useToast } from '../common/Toast'

function EventForm({ initial, types, me, onDone }: { initial?: ChurchEvent; types: EventType[]; me?: string; onDone: () => void }) {
  const toast = useToast(); const [busy, setBusy] = useState(false)
  const [v, setV] = useState({ name: initial?.name ?? '', event_type_id: initial?.event_type_id ?? types[0]?.id ?? '', date: initial?.date ?? today(),
    start_time: initial?.start_time ?? '', end_time: initial?.end_time ?? '', location: initial?.location ?? '', description: initial?.description ?? '', status: initial?.status ?? 'scheduled' })
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true)
    try {
      await saveEvent({ name: v.name.trim(), event_type_id: nz(v.event_type_id), date: v.date, start_time: nz(v.start_time), end_time: nz(v.end_time),
        location: nz(v.location), description: nz(v.description), status: v.status as ChurchEvent['status'] }, initial?.id, me)
      toast.push('Event saved'); onDone()
    } catch (x) { toast.push((x as Error).message, 'error') } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Event name"><input className={inputCls} required value={v.name} onChange={set('name')} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Event type"><select className={inputCls} value={v.event_type_id} onChange={set('event_type_id')}>{types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
        <Field label="Date"><input className={inputCls} type="date" required value={v.date} onChange={set('date')} /></Field>
        <Field label="Start time"><input className={inputCls} type="time" value={v.start_time} onChange={set('start_time')} /></Field>
        <Field label="End time"><input className={inputCls} type="time" value={v.end_time} onChange={set('end_time')} /></Field>
      </div>
      <Field label="Location"><input className={inputCls} value={v.location} onChange={set('location')} /></Field>
      <Field label="Description"><textarea className={inputCls} rows={2} value={v.description} onChange={set('description')} /></Field>
      <Field label="Status"><select className={inputCls} value={v.status} onChange={set('status')}><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></Field>
      <button className={btnCls} disabled={busy}>Save event</button>
    </form>
  )
}

function TypesModal({ types, onClose, onChanged }: { types: EventType[]; onClose: () => void; onChanged: () => void }) {
  const toast = useToast(); const [name, setName] = useState('')
  const add = async (e: FormEvent) => {
    e.preventDefault()
    try { await addEventType(name); setName(''); toast.push('Event type added'); onChanged() } catch (x) { toast.push((x as Error).message.includes('unique') ? 'That type already exists' : (x as Error).message, 'error') }
  }
  return (
    <Modal title="Event types" onClose={onClose}>
      <ul className="mb-3 flex flex-wrap gap-2">{types.map((t) => <li key={t.id} className="rounded-full bg-slate-100 px-3 py-1 text-sm">{t.name}</li>)}</ul>
      <form onSubmit={add} className="flex gap-2"><input className={inputCls} required placeholder="New type, e.g. Prayer Night" value={name} onChange={(e) => setName(e.target.value)} /><button className={`${btnPrimarySm} shrink-0`}>Add</button></form>
    </Modal>
  )
}

export default function EventsPage() {
  const { profile } = useAuth(); const toast = useToast(); const isStaff = profile?.role !== 'leader'
  const [rows, setRows] = useState<ChurchEvent[] | null>(null); const [types, setTypes] = useState<EventType[]>([])
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming'); const [typeF, setTypeF] = useState('')
  const [edit, setEdit] = useState<ChurchEvent | 'new' | null>(null); const [showTypes, setShowTypes] = useState(false)
  const load = () => Promise.all([listEvents(), listEventTypes()]).then(([e, t]) => { setRows(e); setTypes(t) }).catch((e) => { toast.push(e.message, 'error'); setRows([]) })
  useEffect(() => { void load() }, [])
  if (!rows) return <Spinner />
  const t = today()
  const shown = rows.filter((e) => (tab === 'upcoming' ? e.date >= t : e.date < t) && (!typeF || e.event_type_id === typeF))
    .sort((a, b) => (tab === 'upcoming' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)))
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Events</h1>
        {isStaff && <div className="flex gap-2"><button className={btnSm} onClick={() => setShowTypes(true)}><Tags size={14} className="mr-1 inline" />Types</button>
          <button className={btnPrimarySm} onClick={() => setEdit('new')}><Plus size={16} />Add event</button></div>}</div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-sm">{(['upcoming', 'past'] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-md px-3 py-1 capitalize ${tab === k ? 'bg-white shadow-sm' : 'text-slate-500'}`}>{k}</button>))}</div>
        <select className={`${inputCls} w-auto`} value={typeF} onChange={(e) => setTypeF(e.target.value)}><option value="">All types</option>{types.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
      </div>
      {shown.length === 0 ? <Empty text={isStaff ? `No ${tab} events. Add one to start tracking attendance.` : `No ${tab} events.`} /> : (
        <div className="space-y-2">{shown.map((e) => (
          <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm">
            <div className="min-w-0 space-y-0.5">
              <p className="font-medium">{e.name} {e.type && <span className="ml-1 rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700">{e.type.name}</span>}</p>
              <p className="flex items-center gap-1 text-sm text-slate-500"><CalendarDays size={14} />{fmtDate(e.date)} {fmtTime(e.start_time)}{e.end_time && `–${fmtTime(e.end_time)}`}</p>
              {e.location && <p className="flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} />{e.location}</p>}
            </div>
            <div className="flex items-center gap-2">{e.status !== 'scheduled' && <Badge v={e.status} />}
              {isStaff && <button className={btnSm} onClick={() => setEdit(e)}>Edit</button>}
              <Link to={`/events/${e.id}`} className={`${btnSm} inline-flex items-center gap-1 text-indigo-700`}><ClipboardCheck size={14} />Attendance</Link></div>
          </div>))}</div>
      )}
      {edit && <Modal title={edit === 'new' ? 'Add event' : 'Edit event'} onClose={() => setEdit(null)}>
        <EventForm initial={edit === 'new' ? undefined : edit} types={types} me={profile?.id} onDone={() => { setEdit(null); void load() }} /></Modal>}
      {showTypes && <TypesModal types={types} onClose={() => setShowTypes(false)} onChanged={() => void load()} />}
    </div>
  )
}
