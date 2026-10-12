import { useEffect, useState, type FormEvent } from 'react'
import { Plus, UserCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { convertInvitee, listInvitees, saveInvitee } from '../../services/disciples'
import { listGroups } from '../../services/cellGroups'
import type { CellGroup, Invitee, InviteeStatus } from '../../types'
import { Badge, Empty, Field, Spinner, btnCls, btnPrimarySm, btnSm, inputCls, nz } from '../common/ui'
import { ConfirmModal, Modal } from '../common/Modal'
import { useToast } from '../common/Toast'

const STATUSES: InviteeStatus[] = ['new', 'contacted', 'attended', 'joined', 'converted', 'no_response']

function InviteeForm({ initial, groups, isStaff, me, onDone }: { initial?: Invitee; groups: CellGroup[]; isStaff: boolean; me?: string; onDone: () => void }) {
  const toast = useToast(); const [busy, setBusy] = useState(false)
  const [v, setV] = useState({ first_name: initial?.first_name ?? '', last_name: initial?.last_name ?? '', phone: initial?.phone ?? '', email: initial?.email ?? '',
    date_invited: initial?.date_invited ?? new Date().toISOString().slice(0, 10), follow_up_date: initial?.follow_up_date ?? '', status: initial?.status ?? 'new',
    cell_group_id: initial?.cell_group_id ?? groups[0]?.id ?? '', notes: initial?.notes ?? '' })
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!v.cell_group_id) { toast.push('A cell group is required', 'error'); return }
    setBusy(true)
    try {
      await saveInvitee({ first_name: v.first_name.trim(), last_name: v.last_name.trim(), phone: nz(v.phone), email: nz(v.email), date_invited: nz(v.date_invited),
        follow_up_date: nz(v.follow_up_date), status: v.status as InviteeStatus, cell_group_id: v.cell_group_id, notes: nz(v.notes) }, initial?.id, me)
      toast.push('Invitee saved'); onDone()
    } catch (x) { toast.push((x as Error).message, 'error') } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="First name"><input className={inputCls} required value={v.first_name} onChange={set('first_name')} /></Field>
        <Field label="Last name"><input className={inputCls} value={v.last_name} onChange={set('last_name')} /></Field>
        <Field label="Phone"><input className={inputCls} type="tel" value={v.phone} onChange={set('phone')} /></Field>
        <Field label="Email"><input className={inputCls} type="email" value={v.email} onChange={set('email')} /></Field>
        <Field label="Date invited"><input className={inputCls} type="date" value={v.date_invited} onChange={set('date_invited')} /></Field>
        <Field label="Follow-up date"><input className={inputCls} type="date" value={v.follow_up_date} onChange={set('follow_up_date')} /></Field>
      </div>
      <Field label="Status"><select className={inputCls} value={v.status} onChange={set('status')}>{STATUSES.filter((s) => s !== 'converted').map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></Field>
      {isStaff && <Field label="Cell group"><select className={inputCls} value={v.cell_group_id} onChange={set('cell_group_id')}><option value="">— Select —</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>}
      <Field label="Notes"><textarea className={inputCls} rows={2} value={v.notes} onChange={set('notes')} /></Field>
      <button className={btnCls} disabled={busy}>Save</button>
    </form>
  )
}

export default function InviteesPage() {
  const { profile } = useAuth(); const toast = useToast(); const isStaff = profile?.role !== 'leader'
  const [rows, setRows] = useState<Invitee[] | null>(null); const [groups, setGroups] = useState<CellGroup[]>([]); const [status, setStatus] = useState('')
  const [edit, setEdit] = useState<Invitee | 'new' | null>(null); const [conv, setConv] = useState<Invitee | null>(null)
  const load = () => Promise.all([listInvitees(), listGroups()]).then(([i, g]) => { setRows(i); setGroups(g) }).catch((e) => { toast.push(e.message, 'error'); setRows([]) })
  useEffect(() => { void load() }, [])
  if (!rows) return <Spinner />
  const shown = rows.filter((i) => !status || i.status === status)
  const actions = (i: Invitee) => i.converted_disciple_id ? <Badge v="converted" /> : (<div className="flex gap-2">
    <button className={btnSm} onClick={() => setEdit(i)}>Edit</button>
    <button className={`${btnSm} inline-flex items-center gap-1 text-indigo-700`} onClick={() => setConv(i)}><UserCheck size={14} />Convert</button></div>)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Invitees <span className="text-sm font-normal text-slate-400">({shown.length})</span></h1>
        <button className={btnPrimarySm} onClick={() => setEdit('new')}><Plus size={16} />Add</button></div>
      <select className={`${inputCls} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select>
      {shown.length === 0 ? <Empty text={rows.length ? 'No invitees match this status.' : 'No invitees yet. Add someone you invited.'} /> : (
        <div className="divide-y rounded-xl bg-white shadow-sm">{shown.map((i) => (
          <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0"><p className="font-medium">{i.first_name} {i.last_name}</p>
              <p className="text-sm text-slate-500">{[i.group?.name, i.phone, i.date_invited && `Invited ${i.date_invited}`, i.follow_up_date && `Follow up ${i.follow_up_date}`].filter(Boolean).join(' · ')}</p></div>
            <div className="flex items-center gap-2">{!i.converted_disciple_id && <Badge v={i.status} />}{actions(i)}</div>
          </div>))}</div>
      )}
      {edit && <Modal title={edit === 'new' ? 'Add invitee' : 'Edit invitee'} onClose={() => setEdit(null)}>
        <InviteeForm initial={edit === 'new' ? undefined : edit} groups={groups} isStaff={isStaff} me={profile?.id} onDone={() => { setEdit(null); void load() }} /></Modal>}
      {conv && <ConfirmModal title="Convert to disciple?" label="Convert" text={`${conv.first_name} ${conv.last_name}'s details will be copied into a new disciple record in their cell group.`} onClose={() => setConv(null)}
        onConfirm={async () => { try { await convertInvitee(conv.id); toast.push('Converted to disciple'); await load() } catch (e) { toast.push((e as Error).message, 'error') } }} />}
    </div>
  )
}
