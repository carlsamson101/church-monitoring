import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { loadBase, loadPeriod, type Base, type Filters, type Period } from '../../services/analytics'
import { monthRange, today } from '../../lib/format'
import { downloadCsv } from '../../lib/csv'
import { Empty, Field, Spinner, btnPrimarySm, inputCls } from '../common/ui'
import { useToast } from '../common/Toast'
import { buildReport, REPORTS, type ReportKey } from './buildReports'

const D_STATUS = ['new_disciple', 'active', 'inactive', 'transferred', 'completed']
const I_STATUS = ['new', 'contacted', 'attended', 'joined', 'converted', 'no_response']

export default function ReportsPage() {
  const toast = useToast(); const [key, setKey] = useState<ReportKey>('attendance')
  const [base, setBase] = useState<Base | null>(null); const [per, setPer] = useState<Period | null>(null)
  const [f, setF] = useState<Filters>({ from: monthRange(0)[0], to: today(), group: '', leader: '', status: '', eventId: '' })
  useEffect(() => { loadBase(true).then(setBase).catch((e) => toast.push(e.message, 'error')) }, [])
  useEffect(() => { setPer(null); loadPeriod(f.from, f.to).then(setPer).catch((e) => toast.push(e.message, 'error')) }, [f.from, f.to])
  const report = useMemo(() => (base && per ? buildReport(key, base, per, f) : null), [key, base, per, f])
  const set = (k: keyof Filters) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  if (!base) return <Spinner />
  const statuses = key === 'invitees' ? I_STATUS : D_STATUS
  const showStatus = key !== 'cellgroups' && key !== 'leaders' && key !== 'events' && key !== 'checklist'
  const showEvent = key === 'attendance' || key === 'events' || key === 'disciples' || key === 'cellgroups' || key === 'leaders'
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h1 className="text-xl font-semibold">Reports</h1>
        <button className={btnPrimarySm} disabled={!report?.rows.length} onClick={() => report && downloadCsv(`${key}-${f.from}-to-${f.to}`, report.columns, report.rows)}><Download size={16} />Export CSV (Excel)</button></div>
      <div className="flex flex-wrap gap-1">{REPORTS.map((r) => (
        <button key={r.key} onClick={() => { setKey(r.key); setF({ ...f, status: '', eventId: '' }) }} className={`rounded-full px-3 py-1 text-sm ${key === r.key ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 shadow-sm'}`}>{r.label}</button>))}</div>
      <div className="grid gap-2 rounded-xl bg-white p-3 shadow-sm sm:grid-cols-3 lg:grid-cols-6">
        <Field label="From"><input type="date" className={inputCls} value={f.from} onChange={set('from')} /></Field>
        <Field label="To"><input type="date" className={inputCls} value={f.to} onChange={set('to')} /></Field>
        <Field label="Cell group"><select className={inputCls} value={f.group} onChange={set('group')}><option value="">All</option>{base.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
        <Field label="Leader"><select className={inputCls} value={f.leader} onChange={set('leader')}><option value="">All</option>{base.leaders.map((l) => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}</select></Field>
        {showStatus && <Field label="Status"><select className={inputCls} value={f.status} onChange={set('status')}><option value="">All</option>{key !== 'invitees' && <option value="open">Active & new</option>}{statuses.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></Field>}
        {showEvent && <Field label="Event"><select className={inputCls} value={f.eventId} onChange={set('eventId')}><option value="">All events</option>{(per?.events ?? []).map((e) => <option key={e.id} value={e.id}>{e.date} {e.name}</option>)}</select></Field>}
      </div>
      {!report ? <Spinner /> : report.rows.length === 0 ? <Empty text="No data for these filters." /> : (<>
        <p className="text-sm text-slate-500">{report.rows.length} row{report.rows.length === 1 ? '' : 's'}</p>
        <div className="hidden overflow-x-auto rounded-xl bg-white shadow-sm md:block"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{report.columns.map((c) => <th key={c} className="whitespace-nowrap p-3">{c}</th>)}</tr></thead>
          <tbody className="divide-y">{report.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={`p-3 ${j === 0 ? 'font-medium' : ''}`}>{c}</td>)}</tr>)}</tbody></table></div>
        <div className="space-y-2 md:hidden">{report.rows.map((r, i) => (
          <div key={i} className="rounded-xl bg-white p-4 shadow-sm"><p className="mb-1 font-medium">{r[0]}</p>
            {r.slice(1).map((c, j) => c !== '' && <div key={j} className="flex justify-between text-sm"><span className="text-slate-500">{report.columns[j + 1]}</span><span>{c}</span></div>)}</div>))}</div>
      </>)}
      <p className="text-xs text-slate-400">Attendance % counts events in the period; unrecorded attendance counts as missed. Checklist % is completed ÷ recorded. Exports open directly in Excel.</p>
    </div>
  )
}
