import { supabase } from '../lib/supabase'
import type { CellGroup, Profile } from '../types'

export async function listGroups(): Promise<CellGroup[]> {
  const { data, error } = await supabase.from('cell_groups').select('*, leader:profiles!leader_id(first_name,last_name)').order('name')
  if (error) throw error
  return data as unknown as CellGroup[]
}
export async function saveGroup(v: Partial<CellGroup>, id?: string) {
  const { error } = id ? await supabase.from('cell_groups').update(v).eq('id', id) : await supabase.from('cell_groups').insert(v)
  if (error) throw error
}
export async function listLeaders(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'leader').order('first_name')
  if (error) throw error
  return data as Profile[]
}
export async function setLeaderStatus(id: string, status: 'active' | 'inactive') {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', id)
  if (error) throw error
}
