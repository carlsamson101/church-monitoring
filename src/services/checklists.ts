import { supabase } from '../lib/supabase'
import type { ChecklistCategory, ChecklistItem, ChecklistRecord } from '../types'

// PostgREST returns at most 1000 rows per request, so page through big result sets.
async function pageAll<T>(make: (a: number, b: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = []
  for (let f = 0; ; f += 1000) {
    const { data, error } = await make(f, f + 999)
    if (error) throw new Error(error.message)
    out.push(...((data ?? []) as T[]))
    if (!data || data.length < 1000) break
  }
  return out
}

export async function listCategories(): Promise<ChecklistCategory[]> {
  const { data, error } = await supabase.from('checklist_categories').select('*').order('name')
  if (error) throw error
  return data as ChecklistCategory[]
}
export async function saveCategory(v: Partial<ChecklistCategory>, id?: string) {
  const { error } = id ? await supabase.from('checklist_categories').update(v).eq('id', id) : await supabase.from('checklist_categories').insert(v)
  if (error) throw error
}
export async function deleteCategory(id: string) {
  const { error } = await supabase.from('checklist_categories').delete().eq('id', id)
  if (error) throw error
}
export async function deleteItem(id: string) {
  const { error } = await supabase.from('checklist_items').delete().eq('id', id)
  if (error) throw error
}
export async function listItems(): Promise<ChecklistItem[]> {
  const { data, error } = await supabase.from('checklist_items').select('*, category:checklist_categories(name)').order('name')
  if (error) throw error
  return data as unknown as ChecklistItem[]
}
export async function saveItem(v: Partial<ChecklistItem>, id?: string) {
  const row: Record<string, unknown> = { ...v }; delete row.category
  const { error } = id ? await supabase.from('checklist_items').update(row).eq('id', id) : await supabase.from('checklist_items').insert(row)
  if (error) throw error
}
export async function seedStarter() {
  const plan: [string, string, [string, string][]][] = [
    ['Weekly Discipleship', 'weekly', [['Attended Sunday Service', 'weekly'], ['Attended Weekly Fellowship', 'weekly'], ['One-on-One Discipleship', 'weekly']]],
    ['Spiritual Growth', 'weekly', [['Read Bible', 'weekly'], ['Joined Prayer Meeting', 'weekly'], ['Baptized', 'once']]],
    ['Follow-up', 'weekly', [['Invited Someone', 'weekly'], ['Follow-up Completed', 'weekly']]],
    ['Training', 'once', [['Completed Training', 'once'], ['Completed Encounter', 'once'], ['Joined Ministry', 'once']]],
  ]
  for (const [name, frequency, items] of plan) {
    const { data, error } = await supabase.from('checklist_categories').insert({ name, frequency }).select('id').single()
    if (error) throw error
    const { error: e2 } = await supabase.from('checklist_items').insert(items.map(([n, f]) => ({ category_id: data.id, name: n, frequency: f })))
    if (e2) throw e2
  }
}

export async function getRecordsFor(itemId: string, date: string): Promise<Record<string, boolean>> {
  const { data, error } = await supabase.from('checklist_records').select('disciple_id,completed').eq('checklist_item_id', itemId).eq('date', date).limit(5000)
  if (error) throw error
  return Object.fromEntries((data ?? []).map((r) => [r.disciple_id, r.completed as boolean]))
}
export async function saveRecords(itemId: string, date: string, marks: { disciple_id: string; completed: boolean }[], recordedBy: string) {
  const rows = marks.map((m) => ({ checklist_item_id: itemId, disciple_id: m.disciple_id, date, completed: m.completed, recorded_by: recordedBy }))
  const { error } = await supabase.from('checklist_records').upsert(rows, { onConflict: 'checklist_item_id,disciple_id,date' })
  if (error) throw error
}
export const getRecordsRange = (from: string, to: string) =>
  pageAll<ChecklistRecord>((a, b) => supabase.from('checklist_records').select('checklist_item_id,disciple_id,date,completed').gte('date', from).lte('date', to).range(a, b))

export interface AttRow { disciple_id: string; event_id: string; status: string; events: { date: string; event_type_id: string | null; status: string } }
export const getAttendanceRange = (from: string, to: string) =>
  pageAll<AttRow>((a, b) => supabase.from('attendance').select('disciple_id,event_id,status,events!inner(date,event_type_id,status)').gte('events.date', from).lte('events.date', to).range(a, b))

export async function getDiscipleRecords(discipleId: string) {
  const { data, error } = await supabase.from('checklist_records').select('date,completed,item:checklist_items(name)').eq('disciple_id', discipleId).order('date', { ascending: false }).limit(1000)
  if (error) throw error
  return data as unknown as { date: string; completed: boolean; item: { name: string } | null }[]
}
