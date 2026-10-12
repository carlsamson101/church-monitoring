import { useState, type FormEvent } from 'react'
import { createAccount, updateProfileDetails } from '../../services/users'
import type { Profile } from '../../types'
import { Field, btnCls, inputCls, nz } from '../common/ui'
import { useToast } from '../common/Toast'

const genPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  return Array.from(crypto.getRandomValues(new Uint32Array(12)), (n) => chars[n % chars.length]).join('')
}

export function CreateAccountForm({ roles, onDone }: { roles: ('leader' | 'pastor')[]; onDone: () => void }) {
  const toast = useToast(); const [busy, setBusy] = useState(false)
  const [v, setV] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', role: roles[0] })
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true)
    try { await createAccount({ ...v, phone: v.phone.trim() }); toast.push('Account created. Share the password with them securely.'); onDone() }
    catch (x) { toast.push((x as Error).message, 'error') } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="First name"><input className={inputCls} required value={v.first_name} onChange={set('first_name')} /></Field>
        <Field label="Last name"><input className={inputCls} required value={v.last_name} onChange={set('last_name')} /></Field>
      </div>
      <Field label="Email"><input className={inputCls} type="email" required value={v.email} onChange={set('email')} /></Field>
      <Field label="Phone"><input className={inputCls} type="tel" value={v.phone} onChange={set('phone')} /></Field>
      {roles.length > 1 && <Field label="Role"><select className={inputCls} value={v.role} onChange={set('role')}>{roles.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}</select></Field>}
      <Field label="Temporary password (min 8)">
        <div className="flex gap-2"><input className={inputCls} required minLength={8} value={v.password} onChange={set('password')} />
          <button type="button" className="shrink-0 rounded-lg border px-3 text-sm" onClick={() => setV({ ...v, password: genPassword() })}>Generate</button></div>
      </Field>
      <p className="text-xs text-slate-500">The account is active immediately. Ask them to use “Forgot password” to set their own.</p>
      <button className={btnCls} disabled={busy}>Create {v.role} account</button>
    </form>
  )
}

export function EditProfileForm({ p, onDone }: { p: Profile; onDone: () => void }) {
  const toast = useToast(); const [busy, setBusy] = useState(false)
  const [v, setV] = useState({ first_name: p.first_name, last_name: p.last_name, phone: p.phone ?? '' })
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true)
    try { await updateProfileDetails(p.id, { first_name: v.first_name.trim(), last_name: v.last_name.trim(), phone: nz(v.phone) }); toast.push('Details updated'); onDone() }
    catch (x) { toast.push((x as Error).message, 'error') } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="First name"><input className={inputCls} required value={v.first_name} onChange={set('first_name')} /></Field>
        <Field label="Last name"><input className={inputCls} required value={v.last_name} onChange={set('last_name')} /></Field>
      </div>
      <Field label="Phone"><input className={inputCls} type="tel" value={v.phone} onChange={set('phone')} /></Field>
      <p className="text-xs text-slate-500">Email: {p.email}</p>
      <button className={btnCls} disabled={busy}>Save</button>
    </form>
  )
}
