-- Atomic dispatch operations. Invoked through authenticated Supabase RPC only.
-- SECURITY INVOKER keeps caller RLS; dispatcher must be authorized by role.
-- SECURITY DEFINER here is required to update operational rows through restricted RLS;
-- all entry points verify auth.uid() and role in this transaction.
create or replace function public.dispatch_transition(
  p_action text, p_emergency_id uuid, p_ambulance_id uuid default null, p_status text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_em public.emergencies%rowtype;
  v_am public.ambulances%rowtype;
  v_role text;
  v_next public.emergency_status;
begin
  if auth.uid() is null then raise exception 'Unauthenticated' using errcode='42501'; end if;
  v_role := public.get_current_role();
  if v_role not in ('DISPATCHER','PARAMEDIC') then raise exception 'Forbidden' using errcode='42501'; end if;

  select * into v_em from public.emergencies where id = p_emergency_id for update;
  if not found then raise exception 'Emergency not found' using errcode='P0002'; end if;

  if p_action = 'assign' then
    if v_role <> 'DISPATCHER' or p_ambulance_id is null or v_em.status <> 'pending'
      or v_em.assigned_ambulance_id is not null then
      raise exception 'Invalid assignment' using errcode='23514';
    end if;
    select * into v_am from public.ambulances where id = p_ambulance_id for update;
    if not found or v_am.status <> 'available' or v_am.current_emergency_id is not null then
      raise exception 'Ambulance unavailable' using errcode='23505';
    end if;
    update public.ambulances set status='dispatched', current_emergency_id=p_emergency_id,
      updated_at=now() where id=p_ambulance_id;
    update public.emergencies set status='dispatched', assigned_ambulance_id=p_ambulance_id,
      eta_minutes=null, updated_at=now() where id=p_emergency_id;
    return jsonb_build_object('ok',true,'status','dispatched','ambulanceId',p_ambulance_id);
  elsif p_action = 'release' then
    if v_role <> 'DISPATCHER' or v_em.status not in ('dispatched','en_route') then
      raise exception 'Invalid release' using errcode='23514';
    end if;
    if v_em.assigned_ambulance_id is not null then
      update public.ambulances set status='available', current_emergency_id=null,
        updated_at=now() where id=v_em.assigned_ambulance_id;
    end if;
    update public.emergencies set status='pending', assigned_ambulance_id=null,
      eta_minutes=null, updated_at=now() where id=p_emergency_id;
    return jsonb_build_object('ok',true,'status','pending');
  elsif p_action = 'status' then
    if p_status not in ('en_route','arrived','resolved','cancelled') then
      raise exception 'Invalid status' using errcode='23514';
    end if;
    v_next := p_status::public.emergency_status;
    if not (
      (v_em.status='dispatched' and v_next in ('en_route','cancelled'))
      or (v_em.status='en_route' and v_next in ('arrived','cancelled'))
      or (v_em.status='arrived' and v_next='resolved')
    ) then raise exception 'Invalid status transition' using errcode='23514'; end if;
    if v_em.assigned_ambulance_id is null then raise exception 'No assigned ambulance' using errcode='23514'; end if;
    if v_role = 'PARAMEDIC' and not exists (
      select 1 from public.profiles where id=auth.uid() and ambulance_id=v_em.assigned_ambulance_id
    ) then raise exception 'Not assigned to this ambulance' using errcode='42501'; end if;
    update public.emergencies set status=v_next, updated_at=now() where id=p_emergency_id;
    update public.ambulances set
      status = case
        when v_next='en_route' then 'en_route'::public.ambulance_status
        when v_next='arrived' then 'arrived'::public.ambulance_status
        else 'available'::public.ambulance_status end,
      current_emergency_id=case when v_next in ('resolved','cancelled') then null else p_emergency_id end,
      updated_at=now()
      where id=v_em.assigned_ambulance_id;
    return jsonb_build_object('ok',true,'status',v_next);
  end if;
  raise exception 'Unknown dispatch action' using errcode='23514';
end;
$$;

revoke all on function public.dispatch_transition(text,uuid,uuid,text) from public, anon;
grant execute on function public.dispatch_transition(text,uuid,uuid,text) to authenticated;

-- Prevent direct browser writes to dispatch-controlled ambulance fields.
drop policy if exists "Dispatchers can update ambulances" on public.ambulances;
drop policy if exists "Staff can update ambulances" on public.ambulances;
