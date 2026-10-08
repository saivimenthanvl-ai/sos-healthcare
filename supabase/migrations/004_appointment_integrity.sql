-- Appointment integrity: overlapping active appointments are never allowed.
-- Apply after reviewing legacy duplicates; the constraint deliberately fails
-- if existing records conflict, rather than silently discarding clinical data.
create extension if not exists btree_gist;

alter table public.appointments
  add constraint appointments_positive_duration check (ends_at > starts_at);

alter table public.appointments
  drop constraint if exists no_double_booking;

alter table public.appointments
  add constraint appointments_no_overlapping_active_slots
  exclude using gist (
    doctor_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status in ('PENDING', 'CONFIRMED'));

-- Browser clients may only cancel their own appointments; staff status changes
-- go through server-side authorization and the lifecycle check below.
create or replace function public.check_appointment_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  if new.patient_id is distinct from old.patient_id
     or new.doctor_id is distinct from old.doctor_id then
    raise exception 'Appointment participants cannot be reassigned';
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'PENDING' and new.status in ('CONFIRMED','REJECTED','CANCELLED'))
      or (old.status = 'CONFIRMED' and new.status in ('CANCELLED','COMPLETED','NO_SHOW'))
    ) then
      raise exception 'Invalid appointment status transition';
    end if;

    caller_role := public.get_current_role();
    if caller_role = 'PATIENT'
       and (auth.uid() <> old.patient_id or new.status <> 'CANCELLED') then
      raise exception 'Patient cannot perform this transition';
    end if;
    if caller_role = 'DOCTOR'
       and (auth.uid() <> old.doctor_id or new.status not in ('CONFIRMED','REJECTED','COMPLETED','NO_SHOW')) then
      raise exception 'Doctor cannot perform this transition';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists appointment_transition_guard on public.appointments;
create trigger appointment_transition_guard
before update on public.appointments
for each row execute function public.check_appointment_transition();
