-- Dashboard statistics. SECURITY INVOKER (the default): RLS applies to the caller,
-- so a leader automatically only counts their own group, staff count everything.
-- Run in the Supabase SQL Editor after 001.

create or replace function public.dashboard_trend(p_period text default 'week', p_buckets int default 12)
returns table (bucket date, new_disciples bigint, new_invitees bigint)
language plpgsql stable security invoker set search_path = public as $$
declare step interval;
begin
  if p_period not in ('week','month') then raise exception 'period must be week or month'; end if;
  p_buckets := least(greatest(p_buckets, 1), 60);
  step := case when p_period = 'month' then interval '1 month' else interval '1 week' end;
  return query
  with b as (
    select generate_series(
      date_trunc(p_period, current_date::timestamp) - (p_buckets - 1) * step,
      date_trunc(p_period, current_date::timestamp), step)::date as bk
  )
  select b.bk,
    (select count(*) from disciples d
      where date_trunc(p_period, coalesce(d.date_joined, d.created_at::date)::timestamp)::date = b.bk),
    (select count(*) from invitees i
      where date_trunc(p_period, coalesce(i.date_invited, i.created_at::date)::timestamp)::date = b.bk)
  from b order by b.bk;
end $$;

create or replace function public.disciples_per_group()
returns table (group_name text, total bigint)
language sql stable security invoker set search_path = public as $$
  select cg.name, count(d.id)
  from cell_groups cg
  left join disciples d on d.cell_group_id = cg.id and d.status in ('new_disciple','active')
  group by cg.id, cg.name order by 2 desc, 1 $$;

grant execute on function public.dashboard_trend(text,int), public.disciples_per_group() to authenticated;
