import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
export const Spinner = () => <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-600" /></div>
export const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
export const btnCls = 'w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50'
export const Alert = ({ kind, children }: { kind: 'error' | 'ok'; children: ReactNode }) => (
  <p className={`rounded-lg p-3 text-sm ${kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{children}</p>
)
export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block space-y-1"><span className="text-xs font-medium text-slate-600">{label}</span>{children}</label>
)
const tone: Record<string, string> = { active: 'bg-green-100 text-green-700', new_disciple: 'bg-blue-100 text-blue-700', new: 'bg-blue-100 text-blue-700',
  inactive: 'bg-slate-200 text-slate-600', pending: 'bg-amber-100 text-amber-700', converted: 'bg-purple-100 text-purple-700', completed: 'bg-purple-100 text-purple-700' }
export const Badge = ({ v }: { v: string }) => <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${tone[v] ?? 'bg-slate-100 text-slate-700'}`}>{v.replace('_', ' ')}</span>
export const Empty = ({ text }: { text: string }) => <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">{text}</div>
export const btnSm = 'rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50'
export const btnPrimarySm = 'inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700'
export const nz = (s: string) => (s.trim() === '' ? null : s.trim())
