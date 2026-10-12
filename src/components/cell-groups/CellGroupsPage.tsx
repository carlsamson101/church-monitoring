import { useEffect, useState, type FormEvent } from 'react'
import { Plus, MapPin, Clock } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { listGroups, listLeaders, saveGroup } from '../../services/cellGroups'
import type { CellGroup, Profile } from '../../types'
import { Badge, Empty, Field, Spinner, btnCls, btnPrimarySm, btnSm, inputCls, nz } from '../common/ui'
import { Modal } from '../common/Modal'
import { useToast } from '../common/Toast'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function GroupForm({ initial, leaders, onDone }: { initial?: CellGroup; leaders: Profile[]; onDone: () => void }) {
  const toast = useToast(); const [busy, setBusy] = useState(false)
  const [v, setV] = useState({ name: initial?.name ?? '', description: initial?.description ?? '', location: initial?.location ?? '',
    meeting_day: initial?.meeting_day ?? '', meeting_time: initial?.meeting_time ?? '', leader_id: initial?.leader_id ?? '', status: initial?.status ?? 'active' })
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true)
    try {
      await saveGroup({ name: v.name.trim(), description: nz(v.description), location: nz(v.location), meeting_day: nz(v.meeting_day),
        meeting_time: nz(v.meeting_time), leader_id: nz(v.leader_id), status: v.status as 'active' | 'inactive' }, initial?.id)
      toast.push('Cell group saved'); onDone()
    } catch (x) { toast.push((x as Error).message.includes('unique') ? 'That leader already has a cell group' : (x as Error).message, 'error') } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Group name"><input className={inputCls} required value={v.name} onChange={set('name')} /></Field>
      <Field label="Leader">
        <select className={inputCls} value={v.leader_id} onChange={set('leader_id')}>
          <option value="">— Unassigned —</option>
          {leaders.filter((l) => l.status === 'active').map((l) => <option key={l.id} value={l.id}>{l.first_name} {l.last_name} ({l.email})</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Meeting day"><select className={inputCls} value={v.meeting_day} onChange={set('meeting_day')}><option value="">—</option>{DAYS.map((d) => <option key={d}>{d}</option>)}</select></Field>
        <Field label="Time"><input type="time" className={inputCls} value={v.meeting_time} onChange={set('meeting_time')} /></Field>
      </div>
      <Field label="Location"><input className={inputCls} value={v.location} onChange={set('location')} /></Field>
      <Field label="Description"><textarea className={inputCls} rows={2} value={v.description} onChange={set('description')} /></Field>
      <Field label="Status"><select className={inputCls} value={v.status} onChange={set('status')}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
      <button className={btnCls} disabled={busy}>Save</button>
    </form>
  )
}

export default function CellGroupsPage() {
  const { profile } = useAuth(); const toast = useToast(); const isStaff = profile?.role !== 'leader'
  const [rows, setRows] = useState<CellGroup[] | null>(null); const [leaders, setLeaders] = useState<Profile[]>([])
  const [edit, setEdit] = useState<CellGroup | 'new' | null>(null)
  const load = () => Promise.all([listGroups(), isStaff ? listLeaders() : Promise.resolve([])])
    .then(([g, l]) => { setRows(g); setLeaders(l) }).catch((e) => { toast.push(e.message, 'error'); setRows([]) })
  useEffect(() => { void load() }, [])
  if (!rows) return <Spinner />
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isStaff ? 'Cell Groups' : 'My Cell Group'}</h1>
        {isStaff && <button className={btnPrimarySm} onClick={() => setEdit('new')}><Plus size={16} />Add group</button>}
      </div>
      {rows.length === 0 ? <Empty text={isStaff ? 'No cell groups yet. Add the first one.' : 'You have not been assigned to a cell group yet.'} /> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((g) => (
            <div key={g.id} className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between"><h2 className="font-medium">{g.name}</h2><Badge v={g.status} /></div>
              <p className="text-sm text-slate-600">Leader: {g.leader ? `${g.leader.first_name} ${g.leader.last_name}` : 'Unassigned'}</p>
              {(g.meeting_day || g.meeting_time) && <p className="flex items-center gap-1 text-sm text-slate-500"><Clock size={14} />{g.meeting_day} {g.meeting_time?.slice(0, 5)}</p>}
              {g.location && <p className="flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} />{g.location}</p>}
              {isStaff && <button className={btnSm} onClick={() => setEdit(g)}>Edit</button>}
            </div>
          ))}
        </div>
      )}
      {edit && <Modal title={edit === 'new' ? 'Add cell group' : 'Edit cell group'} onClose={() => setEdit(null)}>
        <GroupForm initial={edit === 'new' ? undefined : edit} leaders={leaders} onDone={() => { setEdit(null); void load() }} /></Modal>}
    </div>
  )
}
