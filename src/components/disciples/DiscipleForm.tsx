import { useState, type FormEvent } from 'react'
import { saveDisciple } from '../../services/disciples'
import type { CellGroup, Disciple } from '../../types'
import { Field, btnCls, inputCls, nz } from '../common/ui'
import { useToast } from '../common/Toast'

export const D_STATUSES = ['new_disciple', 'active', 'inactive', 'transferred', 'completed']

export default function DiscipleForm({ initial, groups, isStaff, onDone }: { initial?: Disciple; groups: CellGroup[]; isStaff: boolean; onDone: () => void }) {
  const toast = useToast(); const [busy, setBusy] = useState(false)
  const [v, setV] = useState({ first_name: initial?.first_name ?? '', last_name: initial?.last_name ?? '', nickname: initial?.nickname ?? '',
    phone: initial?.phone ?? '', email: initial?.email ?? '', address: initial?.address ?? '', date_joined: initial?.date_joined ?? new Date().toISOString().slice(0, 10),
    status: initial?.status ?? 'new_disciple', cell_group_id: initial?.cell_group_id ?? groups[0]?.id ?? '', notes: initial?.notes ?? '' })
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!v.cell_group_id) { toast.push('A cell group is required', 'error'); return }
    setBusy(true)
    try {
      await saveDisciple({ first_name: v.first_name.trim(), last_name: v.last_name.trim(), nickname: nz(v.nickname), phone: nz(v.phone), email: nz(v.email),
        address: nz(v.address), date_joined: nz(v.date_joined), status: v.status, cell_group_id: v.cell_group_id, notes: nz(v.notes) } as Partial<Disciple>, initial?.id)
      toast.push('Disciple saved'); onDone()
    } catch (x) { toast.push((x as Error).message, 'error') } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="First name"><input className={inputCls} required value={v.first_name} onChange={set('first_name')} /></Field>
        <Field label="Last name"><input className={inputCls} required value={v.last_name} onChange={set('last_name')} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Nickname"><input className={inputCls} value={v.nickname} onChange={set('nickname')} /></Field>
        <Field label="Phone"><input className={inputCls} type="tel" value={v.phone} onChange={set('phone')} /></Field>
      </div>
      <Field label="Email"><input className={inputCls} type="email" value={v.email} onChange={set('email')} /></Field>
      <Field label="Address"><input className={inputCls} value={v.address} onChange={set('address')} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Date joined"><input className={inputCls} type="date" value={v.date_joined} onChange={set('date_joined')} /></Field>
        <Field label="Status"><select className={inputCls} value={v.status} onChange={set('status')}>{D_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></Field>
      </div>
      {isStaff ? (
        <Field label={initial ? 'Cell group (change to transfer)' : 'Cell group'}>
          <select className={inputCls} value={v.cell_group_id} onChange={set('cell_group_id')}><option value="">— Select —</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
        </Field>
      ) : groups.length === 0 && <p className="text-sm text-red-600">You have no cell group assigned yet.</p>}
      <Field label="Notes"><textarea className={inputCls} rows={2} value={v.notes} onChange={set('notes')} /></Field>
      <button className={btnCls} disabled={busy}>Save</button>
    </form>
  )
}
