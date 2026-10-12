import { useEffect, useState } from 'react'
import { Check, Save, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getRecordsFor, listItems, saveRecords } from '../../services/checklists'
import { listDisciples } from '../../services/disciples'
import { listGroups } from '../../services/cellGroups'
import type { CellGroup, ChecklistItem, Disciple } from '../../types'
import { today } from '../../lib/format'
import { Empty, Spinner, inputCls } from '../common/ui'
import { useToast } from '../common/Toast'

export default function RecordChecklistPage() {
  const { profile } = useAuth(); const toast = useToast(); const isStaff = profile?.role !== 'leader'
  const [items, setItems] = useState<ChecklistItem[] | null>(null); const [people, setPeople] = useState<Disciple[]>([]); const [groups, setGroups] = useState<CellGroup[]>([])
  const [itemId, setItemId] = useState(''); const [date, setDate] = useState(today()); const [group, setGroup] = useState('')
  const [saved, setSaved] = useState<Record<string, boolean>>({}); const [marks, setMarks] = useState<Record<string, boolean>>({}); const [busy, setBusy] = useState(false)

  useEffect(() => { Promise.all([listItems(), listDisciples(), listGroups()]).then(([i, d, g]) => {
    const act = i.filter((x) => x.active); setItems(act); setItemId(act[0]?.id ?? ''); setPeople(d.filter((x) => ['new_disciple', 'active'].includes(x.status))); setGroups(g)
  }).catch((e) => { toast.push(e.message, 'error'); setItems([]) }) }, [])
  useEffect(() => { if (itemId && date) getRecordsFor(itemId, date).then((r) => { setSaved(r); setMarks(r) }).catch((e) => toast.push(e.message, 'error')) }, [itemId, date])

  if (!items) return <Spinner />
  if (items.length === 0) return <Empty text={isStaff ? 'No active checklist items. Create some under Checklists.' : 'No checklist items yet. Ask your pastor to set them up.'} />
  const shown = people.filter((p) => !group || p.cell_group_id === group)
  const dirty = Object.keys(marks).filter((k) => marks[k] !== saved[k])
  const cats = [...new Set(items.map((i) => i.category?.name ?? 'Other'))]
  const save = async () => {
    if (!profile) return; setBusy(true)
    try { await saveRecords(itemId, date, dirty.map((k) => ({ disciple_id: k, completed: marks[k] })), profile.id); setSaved(marks); toast.push(`Saved ${dirty.length} record${dirty.length === 1 ? '' : 's'}`) }
    catch (e) { toast.push((e as Error).message, 'error') } finally { setBusy(false) }
  }
  return (
    <div className="max-w-3xl space-y-4 pb-16">
      <h1 className="text-xl font-semibold">Record checklist</h1>
      <div className="grid gap-2 sm:grid-cols-3">
        <select className={inputCls} value={itemId} onChange={(e) => setItemId(e.target.value)}>{cats.map((c) => <optgroup key={c} label={c}>{items.filter((i) => (i.category?.name ?? 'Other') === c).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</optgroup>)}</select>
        <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
        {isStaff && <select className={inputCls} value={group} onChange={(e) => setGroup(e.target.value)}><option value="">All groups</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>}
      </div>
      <button className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50" onClick={() => setMarks((m) => ({ ...m, ...Object.fromEntries(shown.map((p) => [p.id, true])) }))}>Mark all done</button>
      {shown.length === 0 ? <Empty text="No active disciples to record." /> : (
        <div className="divide-y rounded-xl bg-white shadow-sm">{shown.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-2 p-3">
            <div className="min-w-0"><p className="font-medium">{p.first_name} {p.last_name}</p>{isStaff && <p className="text-xs text-slate-400">{p.group?.name}</p>}</div>
            <div className="flex gap-1">
              <button onClick={() => setMarks({ ...marks, [p.id]: true })} className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs ${marks[p.id] === true ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'}`}><Check size={14} />Done</button>
              <button onClick={() => setMarks({ ...marks, [p.id]: false })} className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs ${marks[p.id] === false ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}><X size={14} />Not done</button>
            </div></div>))}</div>
      )}
      {dirty.length > 0 && <button onClick={save} disabled={busy} className="fixed bottom-20 right-4 z-20 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-lg disabled:opacity-50 md:bottom-6"><Save size={16} />Save {dirty.length} change{dirty.length === 1 ? '' : 's'}</button>}
    </div>
  )
}
