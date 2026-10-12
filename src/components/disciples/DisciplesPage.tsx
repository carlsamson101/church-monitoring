import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { listDisciples } from '../../services/disciples'
import { listGroups } from '../../services/cellGroups'
import type { CellGroup, Disciple } from '../../types'
import { Badge, Empty, Spinner, btnPrimarySm, btnSm, inputCls } from '../common/ui'
import { Modal } from '../common/Modal'
import { useToast } from '../common/Toast'
import DiscipleForm, { D_STATUSES } from './DiscipleForm'

export default function DisciplesPage() {
  const { profile } = useAuth(); const toast = useToast(); const isStaff = profile?.role !== 'leader'
  const [rows, setRows] = useState<Disciple[] | null>(null); const [groups, setGroups] = useState<CellGroup[]>([])
  const [q, setQ] = useState(''); const [status, setStatus] = useState(''); const [group, setGroup] = useState('')
  const [edit, setEdit] = useState<Disciple | 'new' | null>(null)
  const load = () => Promise.all([listDisciples(), listGroups()]).then(([d, g]) => { setRows(d); setGroups(g) }).catch((e) => { toast.push(e.message, 'error'); setRows([]) })
  useEffect(() => { void load() }, [])
  if (!rows) return <Spinner />
  const needle = q.toLowerCase()
  const shown = rows.filter((d) => (!status || d.status === status) && (!group || d.cell_group_id === group) &&
    (!needle || [d.first_name, d.last_name, d.nickname, d.phone].some((x) => x?.toLowerCase().includes(needle))))
  const leaderName = (d: Disciple) => (d.leader ? `${d.leader.first_name} ${d.leader.last_name}` : '—')
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Disciples <span className="text-sm font-normal text-slate-400">({shown.length})</span></h1>
        <button className={btnPrimarySm} onClick={() => setEdit('new')}><Plus size={16} />Add</button></div>
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[10rem] flex-1"><Search size={16} className="absolute left-3 top-2.5 text-slate-400" /><input className={`${inputCls} pl-9`} placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className={`${inputCls} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{D_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select>
        {isStaff && <select className={`${inputCls} w-auto`} value={group} onChange={(e) => setGroup(e.target.value)}><option value="">All groups</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>}
      </div>
      {shown.length === 0 ? <Empty text={rows.length ? 'No disciples match your filters.' : 'No disciples yet. Add your first one.'} /> : (<>
        <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm md:block">
          <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>
            <th className="p-3">Name</th><th>Phone</th><th>Group</th><th>Leader</th><th>Status</th><th /></tr></thead>
            <tbody className="divide-y">{shown.map((d) => (
              <tr key={d.id}><td className="p-3"><Link className="font-medium text-indigo-700" to={`/disciples/${d.id}`}>{d.first_name} {d.last_name}</Link></td>
                <td>{d.phone ?? '—'}</td><td>{d.group?.name ?? '—'}</td><td>{leaderName(d)}</td><td><Badge v={d.status} /></td>
                <td className="pr-3 text-right"><button className={btnSm} onClick={() => setEdit(d)}>Edit</button></td></tr>))}</tbody></table>
        </div>
        <div className="space-y-2 md:hidden">{shown.map((d) => (
          <div key={d.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between"><Link className="font-medium text-indigo-700" to={`/disciples/${d.id}`}>{d.first_name} {d.last_name}</Link><Badge v={d.status} /></div>
            <p className="text-sm text-slate-500">{d.group?.name ?? 'No group'} · {leaderName(d)}</p>
            {d.phone && <a className="text-sm text-slate-600" href={`tel:${d.phone}`}>{d.phone}</a>}
            <div className="mt-2"><button className={btnSm} onClick={() => setEdit(d)}>Edit</button></div>
          </div>))}</div>
      </>)}
      {edit && <Modal title={edit === 'new' ? 'Add disciple' : 'Edit disciple'} onClose={() => setEdit(null)}>
        <DiscipleForm initial={edit === 'new' ? undefined : edit} groups={groups} isStaff={isStaff} onDone={() => { setEdit(null); void load() }} /></Modal>}
    </div>
  )
}
