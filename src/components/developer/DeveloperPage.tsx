import { useEffect, useState } from 'react'
import { Plus, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { listProfiles, setRole, setStatus } from '../../services/users'
import type { Profile, Role } from '../../types'
import { Badge, Spinner, btnPrimarySm, btnSm, inputCls } from '../common/ui'
import { ConfirmModal, Modal } from '../common/Modal'
import { useToast } from '../common/Toast'
import { CreateAccountForm, EditProfileForm } from '../leaders/AccountForms'

// Developer-only. The route is hidden in the UI, and RLS + the profile trigger enforce it in the database.
export default function DeveloperPage() {
  const { profile } = useAuth(); const toast = useToast(); const [rows, setRows] = useState<Profile[] | null>(null)
  const [create, setCreate] = useState(false); const [edit, setEdit] = useState<Profile | null>(null); const [roleAsk, setRoleAsk] = useState<{ p: Profile; to: Exclude<Role, 'developer'> } | null>(null)
  const [stAsk, setStAsk] = useState<Profile | null>(null)
  const load = () => listProfiles().then(setRows).catch((e) => { toast.push(e.message, 'error'); setRows([]) })
  useEffect(() => { void load() }, [])
  if (!rows) return <Spinner />
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Users & roles</h1><button className={btnPrimarySm} onClick={() => setCreate(true)}><Plus size={16} />Create account</button></div>
      <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800"><ShieldAlert size={16} className="mt-0.5 shrink-0" />Only you can see this page. Developer accounts can’t be created or assigned here, and you can’t change your own role.</p>
      <div className="divide-y rounded-xl bg-white shadow-sm">{rows.map((p) => {
        const self = p.id === profile?.id; const locked = self || p.role === 'developer'
        return (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0"><p className="truncate font-medium">{p.first_name} {p.last_name}{self && <span className="text-xs text-slate-400"> (you)</span>}</p><p className="truncate text-sm text-slate-500">{p.email}</p></div>
            <div className="flex flex-wrap items-center gap-2">
              {locked ? <Badge v={p.role} /> : (
                <select className={`${inputCls} w-auto`} value={p.role} onChange={(e) => setRoleAsk({ p, to: e.target.value as 'leader' | 'pastor' })}><option value="leader">Leader</option><option value="pastor">Pastor</option></select>)}
              <Badge v={p.status} /><button className={btnSm} onClick={() => setEdit(p)}>Edit</button>
              {!self && <button className={btnSm} onClick={() => setStAsk(p)}>{p.status === 'active' ? 'Deactivate' : p.status === 'pending' ? 'Approve' : 'Reactivate'}</button>}
            </div>
          </div>)})}</div>
      {create && <Modal title="Create account" onClose={() => setCreate(false)}><CreateAccountForm roles={['pastor', 'leader']} onDone={() => { setCreate(false); void load() }} /></Modal>}
      {edit && <Modal title="Edit user" onClose={() => setEdit(null)}><EditProfileForm p={edit} onDone={() => { setEdit(null); void load() }} /></Modal>}
      {roleAsk && <ConfirmModal title="Change role?" label="Change role" danger onClose={() => setRoleAsk(null)}
        text={`${roleAsk.p.first_name} ${roleAsk.p.last_name} will become a ${roleAsk.to}.${roleAsk.to === 'pastor' ? ' They will see all church data and any cell group they lead will become unassigned.' : ' They will only see their own cell group.'}`}
        onConfirm={async () => { try { await setRole(roleAsk.p.id, roleAsk.to); toast.push('Role updated'); await load() } catch (e) { toast.push((e as Error).message, 'error') } }} />}
      {stAsk && <ConfirmModal title={`${stAsk.status === 'active' ? 'Deactivate' : 'Activate'} user?`} label={stAsk.status === 'active' ? 'Deactivate' : 'Activate'} danger={stAsk.status === 'active'} onClose={() => setStAsk(null)}
        text={`${stAsk.first_name} ${stAsk.last_name} will ${stAsk.status === 'active' ? 'lose access immediately' : 'be able to sign in'}.`}
        onConfirm={async () => { try { await setStatus(stAsk.id, stAsk.status === 'active' ? 'inactive' : 'active'); toast.push('User updated'); await load() } catch (e) { toast.push((e as Error).message, 'error') } }} />}
    </div>
  )
}
