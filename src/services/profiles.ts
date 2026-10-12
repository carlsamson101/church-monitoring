import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

export async function getMyProfile(authUserId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('auth_user_id', authUserId).maybeSingle()
  if (error) throw error
  return data as Profile | null
}
// Role/status are intentionally not updatable here; the DB trigger would reject them anyway.
export async function updateMyProfile(id: string, v: { first_name: string; last_name: string; phone: string }) {
  const { error } = await supabase.from('profiles').update(v).eq('id', id)
  if (error) throw error
}
export async function countRows(table: string, filter?: [string, string]) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true })
  if (filter) q = q.eq(filter[0], filter[1])
  const { count, error } = await q
  if (error) throw error
  return count ?? 0
}
