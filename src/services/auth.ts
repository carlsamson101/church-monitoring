import { supabase } from '../lib/supabase'

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  void supabase.rpc('log_event', { p_action: 'user_login' })
}
// Role is never sent: the DB trigger always creates a pending leader.
export async function signUp(email: string, password: string, first_name: string, last_name: string) {
  const { error } = await supabase.auth.signUp({
    email, password,
    options: { data: { first_name, last_name }, emailRedirectTo: window.location.origin + '/login' },
  })
  if (error) throw error
}
export const signOut = () => supabase.auth.signOut()
export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password',
  })
  if (error) throw error
}
export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}
