import { supabase } from '../lib/supabase'
import type { Profile, Role } from '../types'

export interface NewAccount { email: string; password: string; first_name: string; last_name: string; phone?: string; role: 'leader' | 'pastor' }

export async function createAccount(v: NewAccount) {
  const { data, error } = await supabase.functions.invoke('admin-create-user', { body: v })
  if (error) {
    let msg = error.message
    try { const b = await (error as { context?: Response }).context?.json(); if (b?.error) msg = b.error } catch { /* keep default */ }
    throw new Error(msg)
  }
  return data as { id: string }
}
export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('role').order('first_name')
  if (error) throw error
  return data as Profile[]
}
export async function updateProfileDetails(id: string, v: { first_name: string; last_name: string; phone: string | null }) {
  const { error } = await supabase.from('profiles').update(v).eq('id', id)
  if (error) throw error
}
export async function setStatus(id: string, status: 'active' | 'inactive') {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', id)
  if (error) throw error
}
// Developer only (enforced by RLS + trigger). Leaving the leader role frees their cell group.
export async function setRole(id: string, role: Exclude<Role, 'developer'>) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
  if (error) throw error
  if (role !== 'leader') await supabase.from('cell_groups').update({ leader_id: null }).eq('leader_id', id)
}
