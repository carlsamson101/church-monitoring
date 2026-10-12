import { listDisciples, listInvitees } from './disciples'
import { listGroups, listLeaders } from './cellGroups'
import { listEvents, listEventTypes } from './events'
import { getAttendanceRange, getRecordsRange, listItems, type AttRow } from './checklists'
import type { CellGroup, ChecklistItem, ChecklistRecord, ChurchEvent, Disciple, EventType, Invitee, Profile } from '../types'
import { ymd } from '../lib/format'

export const ACTIVE = ['new_disciple', 'active']
export const KEY_TYPE = /sunday|fellowship|training|encounter/i
export interface Base { types: EventType[]; items: ChecklistItem[]; disciples: Disciple[]; invitees: Invitee[]; groups: CellGroup[]; leaders: Profile[] }
export interface Period { events: ChurchEvent[]; att: AttRow[]; recs: ChecklistRecord[] }
// status: '' = any, 'open' = new_disciple + active, otherwise an exact status
export interface Filters { from: string; to: string; group: string; leader: string; status: string; eventId: string }

// Everything below runs on RLS-scoped data, so leaders only ever aggregate their own group.
export async function loadBase(isStaff: boolean): Promise<Base> {
  const [types, items, disciples, invitees, groups, leaders] = await Promise.all([
    listEventTypes(), listItems(), listDisciples(), listInvitees(), listGroups(), isStaff ? listLeaders() : Promise.resolve([] as Profile[])])
  return { types, items, disciples, invitees, groups, leaders }
}
export async function loadPeriod(from: string, to: string): Promise<Period> {
  const [events, att, recs] = await Promise.all([listEvents(), getAttendanceRange(from, to), getRecordsRange(from, to)])
  return { events: events.filter((e) => e.date >= from && e.date <= to && e.status !== 'cancelled'), att, recs }
}
export const pickPeople = (b: Base, f: Filters) => b.disciples.filter((d) =>
  (!f.group || d.cell_group_id === f.group) && (!f.leader || d.leader_id === f.leader) &&
  (f.status === '' || (f.status === 'open' ? ACTIVE.includes(d.status) : d.status === f.status)))
export const pickEvents = (p: Period, f: Filters) => p.events.filter((e) => !f.eventId || e.id === f.eventId)
export const isAtt = (s: string) => s === 'present' || s === 'late'
export const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : null)
export function attendedCount(p: Period, people: Set<string>, evIds: Set<string>) {
  let n = 0; for (const a of p.att) if (people.has(a.disciple_id) && evIds.has(a.event_id) && isAtt(a.status)) n++; return n
}
export function weekStart(ds: string) { const d = new Date(ds + 'T00:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return ymd(d) }
