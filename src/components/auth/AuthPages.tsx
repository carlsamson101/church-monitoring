import { useId, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Church, Eye, EyeOff, Loader2 } from 'lucide-react'
import { signIn, signUp, requestPasswordReset, updatePassword } from '../../services/auth'
import { Alert } from '../common/ui'
import { isConfigured } from '../../lib/supabase'

/* ---------- shared styles (green theme) ---------- */
const inputBase =
  'w-full rounded-lg border border-green-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 ' +
  'transition focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/30'
const buttonBase =
  'flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white ' +
  'transition hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 ' +
  'focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
const linkCls = 'font-medium text-green-700 hover:text-green-900 hover:underline'

/* ---------- layout ---------- */
function Shell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel (desktop only) */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-green-700 p-12 text-green-50 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-green-500/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-[28rem] w-[28rem] rounded-full bg-green-400/10" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <Church className="h-6 w-6" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Command Center</span>
        </div>

        <div className="relative max-w-md space-y-4">
          <h2 className="font-serif text-4xl leading-tight">Command Center Christian Church</h2>
          <p className="text-base leading-relaxed text-green-100/80">
            A home for our leaders to care for members, coordinate ministries, and keep everything in order.
          </p>
        </div>

        <figure className="relative max-w-md border-l-2 border-green-400/60 pl-4">
          <blockquote className="font-serif text-lg italic text-green-50">
            Let all things be done decently and in order.
          </blockquote>
          <figcaption className="mt-1 text-sm text-green-200/80">1 Corinthians 14:40</figcaption>
        </figure>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center bg-green-50 p-4 sm:p-8">
        <div className="w-full max-w-sm">
          {/* Compact brand header (mobile only) */}
          <div className="mb-6 flex flex-col items-center gap-2 text-center lg:hidden">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-700 text-white shadow-sm">
              <Church className="h-6 w-6" />
            </span>
            <p className="font-serif text-lg text-green-900">Command Center Christian Church</p>
          </div>

          <div className="space-y-5 rounded-2xl bg-white p-6 shadow-lg shadow-green-900/5 ring-1 ring-green-100 sm:p-8">
            <div className="space-y-1">
              <h1 className="font-serif text-2xl font-semibold text-green-950">{title}</h1>
              {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>

            {!isConfigured && (
              <Alert kind="error">Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. See .env.example.</Alert>
            )}

            {children}

            {footer && <div className="border-t border-green-100 pt-4 text-center text-sm text-slate-500">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  )
}

/* ---------- form helpers ---------- */
function useSubmit(fn: () => Promise<string | void>) {
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    setOk('')
    setBusy(true)
    try {
      const m = await fn()
      if (m) setOk(m)
    } catch (x) {
      setErr((x as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return { err, ok, busy, submit }
}

const Msg = ({ err, ok }: { err: string; ok: string }) => (
  <div aria-live="polite" className="space-y-2 empty:hidden">
    {err && <Alert kind="error">{err}</Alert>}
    {ok && <Alert kind="ok">{ok}</Alert>}
  </div>
)

function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  hint,
}: {
  label: string
  type?: 'text' | 'email' | 'password'
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  autoComplete?: string
  minLength?: number
  hint?: string
}) {
  const id = useId()
  const [show, setShow] = useState(false)
  const isPw = type === 'password'
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className={`${inputBase} ${isPw ? 'pr-10' : ''}`}
          type={isPw && show ? 'text' : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          required
          value={value}
          onChange={onChange}
        />
        {isPw && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-slate-400 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600/40"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

function SubmitButton({ busy, label, busyLabel }: { busy: boolean; label: string; busyLabel?: string }) {
  return (
    <button className={buttonBase} disabled={busy}>
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {busy ? busyLabel ?? label : label}
    </button>
  )
}

/* ---------- pages ---------- */
export function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const f = useSubmit(async () => {
    await signIn(email, pw)
    nav('/')
  })
  return (
    <Shell
      title="Welcome back"
      subtitle="Sign in to manage your ministry."
      footer={
        <>
          New leader?{' '}
          <Link className={linkCls} to="/register">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={f.submit} className="space-y-4">
        <Field label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="space-y-1.5">
          <Field label="Password" type="password" autoComplete="current-password" placeholder="Your password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <div className="text-right">
            <Link className={`${linkCls} text-sm`} to="/forgot-password">
              Forgot password?
            </Link>
          </div>
        </div>
        <Msg err={f.err} ok={f.ok} />
        <SubmitButton busy={f.busy} label="Sign in" busyLabel="Signing in…" />
      </form>
    </Shell>
  )
}

export function Register() {
  const [v, setV] = useState({ first: '', last: '', email: '', pw: '', pw2: '' })
  const set = (k: keyof typeof v) => (e: ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value })
  const f = useSubmit(async () => {
    if (v.pw !== v.pw2) throw new Error('Passwords do not match.')
    await signUp(v.email, v.pw, v.first, v.last)
    return 'Account created. Check your email if confirmation is required. A Pastor must approve your leader account before you can access anything.'
  })
  return (
    <Shell
      title="Register as a leader"
      subtitle="A Pastor will review and approve your account."
      footer={
        <>
          Already have an account?{' '}
          <Link className={linkCls} to="/login">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={f.submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" autoComplete="given-name" value={v.first} onChange={set('first')} />
          <Field label="Last name" autoComplete="family-name" value={v.last} onChange={set('last')} />
        </div>
        <Field label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={v.email} onChange={set('email')} />
        <Field label="Password" type="password" autoComplete="new-password" minLength={8} hint="At least 8 characters." value={v.pw} onChange={set('pw')} />
        <Field label="Confirm password" type="password" autoComplete="new-password" minLength={8} value={v.pw2} onChange={set('pw2')} />
        <Msg err={f.err} ok={f.ok} />
        <SubmitButton busy={f.busy} label="Create account" busyLabel="Creating account…" />
      </form>
    </Shell>
  )
}

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const f = useSubmit(async () => {
    await requestPasswordReset(email)
    return 'If that email exists, a reset link has been sent.'
  })
  return (
    <Shell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link className={linkCls} to="/login">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={f.submit} className="space-y-4">
        <Field label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Msg err={f.err} ok={f.ok} />
        <SubmitButton busy={f.busy} label="Send reset link" busyLabel="Sending…" />
      </form>
    </Shell>
  )
}

export function ResetPassword() {
  const nav = useNavigate()
  const [pw, setPw] = useState('')
  const f = useSubmit(async () => {
    await updatePassword(pw)
    nav('/')
  })
  return (
    <Shell title="Choose a new password" subtitle="Pick something you haven't used before.">
      <form onSubmit={f.submit} className="space-y-4">
        <Field label="New password" type="password" autoComplete="new-password" minLength={8} hint="At least 8 characters." value={pw} onChange={(e) => setPw(e.target.value)} />
        <Msg err={f.err} ok={f.ok} />
        <SubmitButton busy={f.busy} label="Update password" busyLabel="Updating…" />
      </form>
    </Shell>
  )
}