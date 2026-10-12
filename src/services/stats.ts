import { supabase } from '../lib/supabase'

export type Period = 'week' | 'month'
export interface TrendPoint { bucket: string; new_disciples: number; new_invitees: number }
export interface GroupTotal { group_name: string; total: number }

export async function getTrend(period: Period, buckets = 12): Promise<TrendPoint[]> {
  const { data, error } = await supabase.rpc('dashboard_trend', { p_period: period, p_buckets: buckets })
  if (error) throw error
  return (data ?? []) as TrendPoint[]
}
export async function getDisciplesPerGroup(): Promise<GroupTotal[]> {
  const { data, error } = await supabase.rpc('disciples_per_group')
  if (error) throw error
  return (data ?? []) as GroupTotal[]
}
