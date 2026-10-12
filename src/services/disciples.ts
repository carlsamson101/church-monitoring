import { supabase } from '../lib/supabase'
import type { Disciple, Invitee } from '../types'

const SEL = '*, group:cell_groups(name), leader:profiles!leader_id(first_name,last_name)'
export async function listDisciples(): Promise<Disciple[]> {
  const { data, error } = await supabase.from('disciples').select(SEL).order('last_name').limit(2000)
  if (error) throw error
  return data as unknown as Disciple[]
}
export async function getDisciple(id: string): Promise<Disciple | null> {
  const { data, error } = await supabase.from('disciples').select(SEL).eq('id', id).maybeSingle()
  if (error) throw error
  return data as unknown as Disciple | null
}
// leader_id always follows the group's leader, so transfers stay consistent.
export async function saveDisciple(v: Partial<Disciple>, id?: string) {
  const row: Record<string, unknown> = { ...v }
  delete row.group; delete row.leader
  if (v.cell_group_id) {
    const { data } = await supabase.from('cell_groups').select('leader_id').eq('id', v.cell_group_id).maybeSingle()
    row.leader_id = data?.leader_id ?? null
  }
  const { error } = id ? await supabase.from('disciples').update(row).eq('id', id) : await supabase.from('disciples').insert(row)
  if (error) throw error
}

export async function listInvitees(): Promise<Invitee[]> {
  const { data, error } = await supabase.from('invitees').select('*, group:cell_groups(name)').order('date_invited', { ascending: false }).limit(2000)
  if (error) throw error
  return data as unknown as Invitee[]
}
export async function saveInvitee(v: Partial<Invitee>, id?: string, invitedBy?: string) {
  const row: Record<string, unknown> = { ...v }; delete row.group
  if (!id && invitedBy) row.invited_by = invitedBy
  const { error } = id ? await supabase.from('invitees').update(row).eq('id', id) : await supabase.from('invitees').insert(row)
  if (error) throw error
}
export async function convertInvitee(id: string): Promise<string> {
  const { data, error } = await supabase.rpc('convert_invitee_to_disciple', { p_invitee: id })
  if (error) throw error
  return data as string
}
