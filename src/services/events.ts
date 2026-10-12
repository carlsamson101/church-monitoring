import { supabase } from '../lib/supabase'
import type { AttendanceHistory, AttStatus, ChurchEvent, EventType } from '../types'

export async function listEventTypes(): Promise<EventType[]> {
  const { data, error } = await supabase.from('event_types').select('*').order('name')
  if (error) throw error
  return data as EventType[]
}
export async function addEventType(name: string) {
  const { error } = await supabase.from('event_types').insert({ name: name.trim() })
  if (error) throw error
}
export async function listEvents(): Promise<ChurchEvent[]> {
  const { data, error } = await supabase.from('events').select('*, type:event_types(name)').order('date', { ascending: false }).limit(500)
  if (error) throw error
  return data as unknown as ChurchEvent[]
}
export async function getEvent(id: string): Promise<ChurchEvent | null> {
  const { data, error } = await supabase.from('events').select('*, type:event_types(name)').eq('id', id).maybeSingle()
  if (error) throw error
  return data as unknown as ChurchEvent | null
}
export async function saveEvent(v: Partial<ChurchEvent>, id?: string, createdBy?: string) {
  const row: Record<string, unknown> = { ...v }; delete row.type
  if (!id) row.created_by = createdBy
  const { error } = id ? await supabase.from('events').update(row).eq('id', id) : await supabase.from('events').insert(row)
  if (error) throw error
}
// RLS limits this to attendance rows of disciples the caller may see.
export async function getEventAttendance(eventId: string): Promise<Record<string, AttStatus>> {
  const { data, error } = await supabase.from('attendance').select('disciple_id,status').eq('event_id', eventId).limit(5000)
  if (error) throw error
  return Object.fromEntries((data ?? []).map((r) => [r.disciple_id, r.status as AttStatus]))
}
export async function saveAttendance(eventId: string, marks: { disciple_id: string; status: AttStatus }[], recordedBy: string) {
  const rows = marks.map((m) => ({ event_id: eventId, disciple_id: m.disciple_id, status: m.status, recorded_by: recordedBy }))
  const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'event_id,disciple_id' })
  if (error) throw error
}
export async function getDiscipleAttendance(discipleId: string): Promise<AttendanceHistory[]> {
  const { data, error } = await supabase.from('attendance').select('status, event:events(name,date,type:event_types(name))').eq('disciple_id', discipleId)
  if (error) throw error
  return ((data ?? []) as unknown as AttendanceHistory[]).filter((r) => r.event).sort((a, b) => b.event!.date.localeCompare(a.event!.date))
}
