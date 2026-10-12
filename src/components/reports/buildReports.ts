import { attendedCount, pct, pickEvents, pickPeople, type Base, type Filters, type Period } from '../../services/analytics'
import type { Disciple } from '../../types'

export type ReportKey = 'attendance' | 'cellgroups' | 'leaders' | 'disciples' | 'invitees' | 'events' | 'discipleship' | 'checklist'
export interface Report { columns: string[]; rows: (string | number)[][] }
export const REPORTS: { key: ReportKey; label: string }[] = [
  { key: 'attendance', label: 'Attendance' }, { key: 'cellgroups', label: 'Cell groups' }, { key: 'leaders', label: 'Leaders' },
  { key: 'disciples', label: 'Disciples' }, { key: 'invitees', label: 'Invitees' }, { key: 'events', label: 'Events' },
  { key: 'discipleship', label: 'Discipleship progress' }, { key: 'checklist', label: 'Checklist completion' },
]
const nm = (d: { first_name: string; last_name: string }) => `${d.first_name} ${d.last_name}`.trim()
const v = (n: number | null) => (n === null ? '' : n)
type A = { present: number; late: number; absent: number; excused: number }

export function buildReport(key: ReportKey, b: Base, p: Period, f: Filters): Report {
  const people = pickPeople(b, f); const ids = new Set(people.map((d) => d.id)); const evs = pickEvents(p, f); const evIds = new Set(evs.map((e) => e.id))
  const gName = (id: string | null) => b.groups.find((g) => g.id === id)?.name ?? ''
  const lName = (d: Disciple) => (d.leader ? nm(d.leader) : '')
  const att = new Map<string, A>(); const rec = new Map<string, { done: number; total: number }>(); const byItem = new Map<string, { done: number; total: number }>()
  for (const a of p.att) if (ids.has(a.disciple_id) && evIds.has(a.event_id)) {
    const r = att.get(a.disciple_id) ?? { present: 0, late: 0, absent: 0, excused: 0 }; r[a.status as keyof A]++; att.set(a.disciple_id, r) }
  for (const r of p.recs) if (ids.has(r.disciple_id)) {
    const x = rec.get(r.disciple_id) ?? { done: 0, total: 0 }; x.total++; if (r.completed) x.done++; rec.set(r.disciple_id, x)
    const y = byItem.get(r.checklist_item_id) ?? { done: 0, total: 0 }; y.total++; if (r.completed) y.done++; byItem.set(r.checklist_item_id, y) }
  const attRate = (l: Disciple[]) => { let n = 0; l.forEach((d) => { const a = att.get(d.id); if (a) n += a.present + a.late }); return pct(n, l.length * evs.length) }
  const recRate = (l: Disciple[]) => { let n = 0, t = 0; l.forEach((d) => { const r = rec.get(d.id); if (r) { n += r.done; t += r.total } }); return pct(n, t) }

  switch (key) {
    case 'attendance': return { columns: ['Disciple', 'Group', 'Leader', 'Present', 'Late', 'Absent', 'Excused', 'Not recorded', 'Attendance %'],
      rows: people.map((d) => { const a = att.get(d.id) ?? { present: 0, late: 0, absent: 0, excused: 0 }; const rc = a.present + a.late + a.absent + a.excused
        return [nm(d), gName(d.cell_group_id), lName(d), a.present, a.late, a.absent, a.excused, Math.max(evs.length - rc, 0), v(pct(a.present + a.late, evs.length))] }) }
    case 'disciples': return { columns: ['Disciple', 'Group', 'Leader', 'Status', 'Date joined', 'Phone', 'Attendance %', 'Checklist %'],
      rows: people.map((d) => [nm(d), gName(d.cell_group_id), lName(d), d.status.replace('_', ' '), d.date_joined ?? '', d.phone ?? '', v(attRate([d])), v(recRate([d]))]) }
    case 'discipleship': return { columns: ['Disciple', 'Group', 'Records', 'Completed', 'Completion %'],
      rows: people.map((d) => { const r = rec.get(d.id); return [nm(d), gName(d.cell_group_id), r?.total ?? 0, r?.done ?? 0, v(r ? pct(r.done, r.total) : null)] }) }
    case 'cellgroups': return { columns: ['Group', 'Leader', 'Status', 'Disciples', 'Invitees', 'Attendance %', 'Checklist %'],
      rows: b.groups.filter((g) => (!f.group || g.id === f.group) && (!f.leader || g.leader_id === f.leader)).map((g) => {
        const m = people.filter((d) => d.cell_group_id === g.id)
        return [g.name, g.leader ? nm(g.leader) : '', g.status, m.length, b.invitees.filter((i) => i.cell_group_id === g.id && (i.date_invited ?? '') >= f.from && (i.date_invited ?? '') <= f.to).length, v(attRate(m)), v(recRate(m))] }) }
    case 'leaders': return { columns: ['Leader', 'Email', 'Status', 'Group', 'Disciples', 'Attendance %', 'Checklist %'],
      rows: b.leaders.filter((l) => (!f.leader || l.id === f.leader) && (!f.group || b.groups.find((g) => g.id === f.group)?.leader_id === l.id)).map((l) => {
        const g = b.groups.find((x) => x.leader_id === l.id); const m = people.filter((d) => g && d.cell_group_id === g.id)
        return [nm(l), l.email ?? '', l.status, g?.name ?? '', m.length, v(attRate(m)), v(recRate(m))] }) }
    case 'invitees': return { columns: ['Invitee', 'Phone', 'Group', 'Date invited', 'Follow-up', 'Status'],
      rows: b.invitees.filter((i) => (i.date_invited ?? '') >= f.from && (i.date_invited ?? '') <= f.to && (!f.group || i.cell_group_id === f.group) &&
        (!f.leader || b.groups.find((g) => g.id === i.cell_group_id)?.leader_id === f.leader) && (f.status === '' || i.status === f.status))
        .map((i) => [nm(i), i.phone ?? '', gName(i.cell_group_id), i.date_invited ?? '', i.follow_up_date ?? '', i.status.replace('_', ' ')]) }
    case 'events': return { columns: ['Event', 'Type', 'Date', 'Attended', 'Recorded', 'Expected', 'Attendance %'],
      rows: evs.map((e) => { const one = new Set([e.id]); const got = attendedCount(p, ids, one); const rc = p.att.filter((a) => a.event_id === e.id && ids.has(a.disciple_id)).length
        return [e.name, e.type?.name ?? '', e.date, got, rc, ids.size, v(pct(got, ids.size))] }) }
    case 'checklist': return { columns: ['Checklist item', 'Category', 'Records', 'Completed', 'Completion %'],
      rows: b.items.filter((i) => byItem.has(i.id)).map((i) => { const r = byItem.get(i.id)!; return [i.name, i.category?.name ?? '', r.total, r.done, v(pct(r.done, r.total))] }) }
  }
}
