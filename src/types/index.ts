export type Role = 'developer' | 'pastor' | 'leader'
export type ProfileStatus = 'pending' | 'active' | 'inactive'
export interface Profile {
  id: string; auth_user_id: string; first_name: string; last_name: string
  email: string | null; phone: string | null; role: Role; status: ProfileStatus
}
export interface CellGroup {
  id: string; name: string; description: string | null; leader_id: string | null; location: string | null
  meeting_day: string | null; meeting_time: string | null; status: 'active' | 'inactive'
  leader?: { first_name: string; last_name: string } | null
}
export type DiscipleStatus = 'invitee' | 'new_disciple' | 'active' | 'inactive' | 'transferred' | 'completed'
export interface Disciple {
  id: string; first_name: string; last_name: string; nickname: string | null; phone: string | null
  email: string | null; address: string | null; date_joined: string | null; status: DiscipleStatus
  cell_group_id: string | null; leader_id: string | null; notes: string | null
  group?: { name: string } | null; leader?: { first_name: string; last_name: string } | null
}
export type InviteeStatus = 'new' | 'contacted' | 'attended' | 'joined' | 'converted' | 'no_response'
export interface Invitee {
  id: string; first_name: string; last_name: string; phone: string | null; email: string | null
  date_invited: string | null; follow_up_date: string | null; status: InviteeStatus
  cell_group_id: string | null; converted_disciple_id: string | null; notes: string | null
  group?: { name: string } | null
}
export interface EventType { id: string; name: string; description: string | null }
export interface ChurchEvent {
  id: string; name: string; description: string | null; event_type_id: string | null; date: string
  start_time: string | null; end_time: string | null; location: string | null
  status: 'scheduled' | 'completed' | 'cancelled'; type?: { name: string } | null
}
export type AttStatus = 'present' | 'absent' | 'late' | 'excused'
export interface AttendanceHistory { status: AttStatus; event: { name: string; date: string; type: { name: string } | null } | null }
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'once'
export interface ChecklistCategory { id: string; name: string; description: string | null; frequency: Frequency; status: 'active' | 'inactive' }
export interface ChecklistItem {
  id: string; category_id: string; name: string; description: string | null; frequency: Frequency
  required: boolean; active: boolean; category?: { name: string } | null
}
export interface ChecklistRecord { checklist_item_id: string; disciple_id: string; date: string; completed: boolean }
