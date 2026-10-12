import { useEffect, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { listCategories, listItems, saveCategory, saveItem, seedStarter, deleteCategory, deleteItem } from '../../services/checklists'
import type { ChecklistCategory, ChecklistItem, Frequency } from '../../types'
import { Badge, Empty, Field, Spinner, btnCls, btnPrimarySm, btnSm, inputCls, nz } from '../common/ui'
import { ConfirmModal, Modal } from '../common/Modal'
import { useToast } from '../common/Toast'

const FREQ: Frequency[] = ['daily', 'weekly', 'monthly', 'once']
const FreqSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>{FREQ.map((f) => <option key={f} value={f}>{f}</option>)}</select>)

function CategoryForm({ initial, onDone }: { initial?: ChecklistCategory; onDone: () => void }) {
  const toast = useToast(); const [busy, setBusy] = useState(false)
  const [v, setV] = useState({ name: initial?.name ?? '', description: initial?.description ?? '', frequency: initial?.frequency ?? 'weekly', status: initial?.status ?? 'active' })
  const submit = async (e: FormEvent) => { e.preventDefault(); setBusy(true)
    try { await saveCategory({ name: v.name.trim(), description: nz(v.description), frequency: v.frequency as Frequency, status: v.status as 'active' | 'inactive' }, initial?.id); toast.push('Category saved'); onDone() }
    catch (x) { toast.push((x as Error).message, 'error') } finally { setBusy(false) } }
  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Category name"><input className={inputCls} required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Field>
      <Field label="Description"><input className={inputCls} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-2"><Field label="Frequency"><FreqSelect value={v.frequency} onChange={(f) => setV({ ...v, frequency: f as Frequency })} /></Field>
        <Field label="Status"><select className={inputCls} value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as 'active' })}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field></div>
      <button className={btnCls} disabled={busy}>Save</button>
    </form>)
}

function ItemForm({ initial, categoryId, onDone }: { initial?: ChecklistItem; categoryId: string; onDone: () => void }) {
  const toast = useToast(); const [busy, setBusy] = useState(false)
  const [v, setV] = useState({ name: initial?.name ?? '', description: initial?.description ?? '', frequency: initial?.frequency ?? 'weekly', required: initial?.required ?? false, active: initial?.active ?? true })
  const submit = async (e: FormEvent) => { e.preventDefault(); setBusy(true)
    try { await saveItem({ category_id: categoryId, name: v.name.trim(), description: nz(v.description), frequency: v.frequency as Frequency, required: v.required, active: v.active }, initial?.id); toast.push('Item saved'); onDone() }
    catch (x) { toast.push((x as Error).message, 'error') } finally { setBusy(false) } }
  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Item name"><input className={inputCls} required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Field>
      <Field label="Description"><input className={inputCls} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></Field>
      <Field label="Frequency"><FreqSelect value={v.frequency} onChange={(f) => setV({ ...v, frequency: f as Frequency })} /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.required} onChange={(e) => setV({ ...v, required: e.target.checked })} />Required for every disciple</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} />Active (shown when recording)</label>
      <button className={btnCls} disabled={busy}>Save</button>
    </form>)
}

export default function ChecklistAdminPage() {
  const toast = useToast(); const [cats, setCats] = useState<ChecklistCategory[] | null>(null); const [items, setItems] = useState<ChecklistItem[]>([])
  const [cEdit, setCEdit] = useState<ChecklistCategory | 'new' | null>(null); const [iEdit, setIEdit] = useState<{ item?: ChecklistItem; categoryId: string } | null>(null); const [busy, setBusy] = useState(false)
  const [del, setDel] = useState<{ kind: 'category' | 'item'; id: string; name: string } | null>(null)
  const load = () => Promise.all([listCategories(), listItems()]).then(([c, i]) => { setCats(c); setItems(i) }).catch((e) => { toast.push(e.message, 'error'); setCats([]) })
  useEffect(() => { void load() }, [])
  if (!cats) return <Spinner />
  const seed = async () => { setBusy(true); try { await seedStarter(); toast.push('Starter checklist added'); await load() } catch (e) { toast.push((e as Error).message, 'error') } finally { setBusy(false) } }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Checklists</h1><button className={btnPrimarySm} onClick={() => setCEdit('new')}><Plus size={16} />Add category</button></div>
      <p className="text-sm text-slate-500">Create the discipleship activities your church tracks. Leaders record them under “Record”.</p>
      {cats.length === 0 ? (
        <div className="space-y-3"><Empty text="No checklist categories yet." /><button className={btnSm} disabled={busy} onClick={seed}>Load a starter checklist (editable afterwards)</button></div>
      ) : (
        <div className="space-y-3">{cats.map((c) => (
          <section key={c.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-medium">{c.name} <span className="text-xs font-normal text-slate-400">{c.frequency}</span></h2>{c.description && <p className="text-sm text-slate-500">{c.description}</p>}</div>
              <div className="flex items-center gap-2">{c.status === 'inactive' && <Badge v="inactive" />}<button className={btnSm} onClick={() => setCEdit(c)}>Edit</button><button className={btnSm} onClick={() => setIEdit({ categoryId: c.id })}>+ Item</button><button className={`${btnSm} text-red-600`} onClick={() => setDel({ kind: 'category', id: c.id, name: c.name })}>Delete</button></div></div>
            <ul className="mt-3 divide-y">{items.filter((i) => i.category_id === c.id).map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 py-2 text-sm"><span className={i.active ? '' : 'text-slate-400 line-through'}>{i.name}{i.required && <span className="ml-1 text-xs text-red-500">required</span>}<span className="ml-2 text-xs text-slate-400">{i.frequency}</span></span>
                <span className="flex gap-2"><button className={btnSm} onClick={() => setIEdit({ item: i, categoryId: c.id })}>Edit</button><button className={`${btnSm} text-red-600`} onClick={() => setDel({ kind: 'item', id: i.id, name: i.name })}>Delete</button></span></li>))}
              {items.every((i) => i.category_id !== c.id) && <li className="py-2 text-sm text-slate-400">No items yet.</li>}</ul>
          </section>))}</div>
      )}
      {cEdit && <Modal title={cEdit === 'new' ? 'Add category' : 'Edit category'} onClose={() => setCEdit(null)}><CategoryForm initial={cEdit === 'new' ? undefined : cEdit} onDone={() => { setCEdit(null); void load() }} /></Modal>}
      {iEdit && <Modal title={iEdit.item ? 'Edit item' : 'Add item'} onClose={() => setIEdit(null)}><ItemForm initial={iEdit.item} categoryId={iEdit.categoryId} onDone={() => { setIEdit(null); void load() }} /></Modal>}
      {del && <ConfirmModal danger title={`Delete ${del.kind}?`} label="Delete" onClose={() => setDel(null)}
        text={del.kind === 'category' ? `Deleting "${del.name}" also deletes all its items and every record ever saved for them. This cannot be undone. To keep history, set items to inactive instead.` : `Deleting "${del.name}" also deletes every record saved for it. This cannot be undone. To keep history, uncheck Active instead.`}
        onConfirm={async () => { try { await (del.kind === 'category' ? deleteCategory(del.id) : deleteItem(del.id)); toast.push('Deleted'); await load() } catch (e) { toast.push((e as Error).message, 'error') } }} />}
    </div>
  )
}
