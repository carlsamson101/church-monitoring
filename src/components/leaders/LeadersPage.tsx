import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { listGroups, listLeaders, setLeaderStatus } from '../../services/cellGroups'
import { listDisciples } from '../../services/disciples'
import type { CellGroup, Disciple, Profile } from '../../types'
import { Badge, Empty, Spinner, btnPrimarySm, btnSm } from '../common/ui'
import { ConfirmModal, Modal } from '../common/Modal'
import { useToast } from '../common/Toast'
import { CreateAccountForm, EditProfileForm } from './AccountForms'

export default function LeadersPage() {
  const toast = useToast(); const [rows, setRows] = useState<Profile[] | null>(null); const [groups, setGroups] = useState<CellGroup[]>([]); const [dis, setDis] = useState<Disciple[]>([])
  const [ask, setAsk] = useState<{ p: Profile; to: 'active' | 'inactive' } | null>(null); const [edit, setEdit] = useState<Profile | null>(null); const [create, setCreate] = useState(false)
  const load = () => Promise.all([listLeaders(), listGroups(), listDisciples()]).then(([l, g, d]) => { setRows(l); setGroups(g); setDis(d) }).catch((e) => { toast.push(e.message, 'error'); setRows([]) })
  useEffect(() => { void load() }, [])
  if (!rows) return <Spinner />
  const info = (p: Profile) => {
    const g = groups.find((x) => x.leader_id === p.id)
    return g ? `${g.name} · ${dis.filter((d) => d.cell_group_id === g.id).length} disciples` : 'No cell group assigned'
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Leaders</h1><button className={btnPrimarySm} onClick={() => setCreate(true)}><Plus size={16} />Add leader</button></div>
      {rows.length === 0 ? <Empty text="No leaders yet. Add one, or approve people who register themselves." /> : (
        <div className="divide-y rounded-xl bg-white shadow-sm">{rows.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0"><p className="truncate font-medium">{p.first_name} {p.last_name}</p><p className="truncate text-sm text-slate-500">{p.email}{p.phone && ` · ${p.phone}`}</p>
              <p className="text-xs text-slate-400">{info(p)}</p></div>
            <div className="flex items-center gap-2"><Badge v={p.status} /><button className={btnSm} onClick={() => setEdit(p)}>Edit</button>
              {p.status === 'active' ? <button className={btnSm} onClick={() => setAsk({ p, to: 'inactive' })}>Deactivate</button>
                : <button className={btnSm} onClick={() => setAsk({ p, to: 'active' })}>{p.status === 'pending' ? 'Approve' : 'Reactivate'}</button>}</div>
          </div>))}</div>
      )}
      {create && <Modal title="Add leader" onClose={() => setCreate(false)}><CreateAccountForm roles={['leader']} onDone={() => { setCreate(false); void load() }} /></Modal>}
      {edit && <Modal title="Edit leader" onClose={() => setEdit(null)}><EditProfileForm p={edit} onDone={() => { setEdit(null); void load() }} /></Modal>}
      {ask && <ConfirmModal title={`${ask.to === 'active' ? 'Activate' : 'Deactivate'} leader?`} danger={ask.to === 'inactive'}
        text={`${ask.p.first_name} ${ask.p.last_name} will ${ask.to === 'active' ? 'be able to sign in and access their group' : 'lose access immediately'}.`}
        label={ask.to === 'active' ? 'Activate' : 'Deactivate'} onClose={() => setAsk(null)}
        onConfirm={async () => { try { await setLeaderStatus(ask.p.id, ask.to); toast.push('Leader updated'); await load() } catch (e) { toast.push((e as Error).message, 'error') } }} />}
    </div>
  )
}
