-- Align RLS with the authorized appointment API.
-- Existing patient/doctor UPDATE policies are too broad: they allow changing
-- unrelated columns and can race with the API. Transition trigger in 004 helps,
-- while this migration enforces role + ownership on writes.
drop policy if exists "Patients update own appointments" on public.appointments;
create policy "Patients update own appointments" on public.appointments
  for update to authenticated using (
    auth.uid() = patient_id and public.get_current_role() = 'PATIENT'
  ) with check (
    auth.uid() = patient_id and public.get_current_role() = 'PATIENT'
  );

drop policy if exists "Doctors update assigned appointments" on public.appointments;
create policy "Doctors update assigned appointments" on public.appointments
  for update to authenticated using (
    auth.uid() = doctor_id and public.get_current_role() = 'DOCTOR'
  ) with check (
    auth.uid() = doctor_id and public.get_current_role() = 'DOCTOR'
  );

drop policy if exists "Patients book own appointments" on public.appointments;
create policy "Patients book own appointments" on public.appointments
  for insert to authenticated with check (
    auth.uid() = patient_id and public.get_current_role() = 'PATIENT'
      and status = 'CONFIRMED'
  );

drop policy if exists "Admins view all appointments" on public.appointments;
create policy "Admins view all appointments" on public.appointments
  for select to authenticated using (public.get_current_role() = 'ADMIN');
create policy "Admins update operational appointments" on public.appointments
  for update to authenticated using (public.get_current_role() = 'ADMIN')
  with check (public.get_current_role() = 'ADMIN');

-- The prior 004 trigger allowed changes to appointment time, reason and
-- hospital during a status update. For now keep updates status-only; future
-- rescheduling requires its own authorized transactional workflow.
create or replace function public.check_appointment_transition()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_role text;
begin
  if (new.patient_id, new.doctor_id, new.hospital_id, new.hospital_name,
      new.specialty, new.starts_at, new.ends_at, new.reason, new.created_at)
     is distinct from
     (old.patient_id, old.doctor_id, old.hospital_id, old.hospital_name,
      old.specialty, old.starts_at, old.ends_at, old.reason, old.created_at)
  then raise exception 'Only appointment status may be updated through this interface'; end if;

  if new.status = old.status then return new; end if;
  if not (
    (old.status='PENDING' and new.status in ('CONFIRMED','REJECTED','CANCELLED'))
    or (old.status='CONFIRMED' and new.status in ('CANCELLED','COMPLETED','NO_SHOW'))
  ) then raise exception 'Invalid appointment transition'; end if;

  v_role := public.get_current_role();
  if v_role='PATIENT' and (auth.uid() <> old.patient_id or new.status <> 'CANCELLED') then
    raise exception 'Patient not permitted';
  elsif v_role='DOCTOR' and (auth.uid() <> old.doctor_id
      or new.status not in ('CONFIRMED','REJECTED','COMPLETED','NO_SHOW')) then
    raise exception 'Doctor not permitted';
  elsif v_role not in ('PATIENT','DOCTOR','ADMIN') then
    raise exception 'Role not permitted';
  end if;
  return new;
end;
$$;

-- Remove old status-unsafe emergency UPDATE policy if still present;
-- migration 003 established cancellation-only patient updates.
drop policy if exists "Users can update own emergencies" on public.emergencies;
