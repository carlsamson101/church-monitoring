import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Church } from 'lucide-react'
import { signIn, signUp, requestPasswordReset, updatePassword } from '../../services/auth'
import { Alert, btnCls, inputCls } from '../common/ui'
import { isConfigured } from '../../lib/supabase'

function Shell({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center gap-2 text-indigo-700"><Church /><h1 className="text-lg font-semibold">{title}</h1></div>
        {!isConfigured && <Alert kind="error">Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. See .env.example.</Alert>}
        {children}
        <div className="text-center text-sm text-slate-500">{footer}</div>
      </div>
    </div>
  )
}

function useSubmit(fn: () => Promise<string | void>) {
  const [err, setErr] = useState(''); const [ok, setOk] = useState(''); const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setOk(''); setBusy(true)
    try { const m = await fn(); if (m) setOk(m) } catch (x) { setErr((x as Error).message) } finally { setBusy(false) }
  }
  return { err, ok, busy, submit }
}
const Msg = ({ err, ok }: { err: string; ok: string }) => <>{err && <Alert kind="error">{err}</Alert>}{ok && <Alert kind="ok">{ok}</Alert>}</>

export function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const f = useSubmit(async () => { await signIn(email, pw); nav('/') })
  return (
    <Shell title="Sign in" footer={<><Link className="text-indigo-600" to="/register">Create account</Link> · <Link className="text-indigo-600" to="/forgot-password">Forgot password?</Link></>}>
      <form onSubmit={f.submit} className="space-y-3">
        <input className={inputCls} type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={inputCls} type="password" placeholder="Password" required value={pw} onChange={(e) => setPw(e.target.value)} />
        <Msg err={f.err} ok={f.ok} />
        <button className={btnCls} disabled={f.busy}>{f.busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </Shell>
  )
}

export function Register() {
  const [v, setV] = useState({ first: '', last: '', email: '', pw: '' })
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value })
  const f = useSubmit(async () => {
    await signUp(v.email, v.pw, v.first, v.last)
    return 'Account created. Check your email if confirmation is required. A Pastor must approve your leader account before you can access anything.'
  })
  return (
    <Shell title="Register as Leader" footer={<Link className="text-indigo-600" to="/login">Back to sign in</Link>}>
      <form onSubmit={f.submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input className={inputCls} placeholder="First name" required value={v.first} onChange={set('first')} />
          <input className={inputCls} placeholder="Last name" required value={v.last} onChange={set('last')} />
        </div>
        <input className={inputCls} type="email" placeholder="Email" required value={v.email} onChange={set('email')} />
        <input className={inputCls} type="password" minLength={8} placeholder="Password (8+ chars)" required value={v.pw} onChange={set('pw')} />
        <Msg err={f.err} ok={f.ok} />
        <button className={btnCls} disabled={f.busy}>Register</button>
      </form>
    </Shell>
  )
}

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const f = useSubmit(async () => { await requestPasswordReset(email); return 'If that email exists, a reset link has been sent.' })
  return (
    <Shell title="Reset password" footer={<Link className="text-indigo-600" to="/login">Back to sign in</Link>}>
      <form onSubmit={f.submit} className="space-y-3">
        <input className={inputCls} type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Msg err={f.err} ok={f.ok} />
        <button className={btnCls} disabled={f.busy}>Send reset link</button>
      </form>
    </Shell>
  )
}

export function ResetPassword() {
  const nav = useNavigate(); const [pw, setPw] = useState('')
  const f = useSubmit(async () => { await updatePassword(pw); nav('/') })
  return (
    <Shell title="Choose a new password">
      <form onSubmit={f.submit} className="space-y-3">
        <input className={inputCls} type="password" minLength={8} placeholder="New password" required value={pw} onChange={(e) => setPw(e.target.value)} />
        <Msg err={f.err} ok={f.ok} />
        <button className={btnCls} disabled={f.busy}>Update password</button>
      </form>
    </Shell>
  )
}
