-- ============================================================
-- Seed the ambulance fleet.
-- Run after schema.sql and migrations/001_roles_and_dispatch.sql.
-- Safe to re-run: vehicles are keyed on vehicle_number.
-- ============================================================

insert into public.ambulances
  (driver_name, vehicle_number, latitude, longitude, status)
values
  ('Amara Osei',   'AMB-01', 12.9716, 77.5946, 'available'),
  ('Rohan Mehta',  'AMB-02', 12.9784, 77.6408, 'available'),
  ('Lena Fischer', 'AMB-03', 12.9136, 77.5850, 'available'),
  ('Diego Alvarez','AMB-04', 13.0358, 77.5970, 'available'),
  ('Sara Lindqvist','AMB-05', 12.9698, 77.7500, 'available')
on conflict do nothing;

-- If the table was created without a unique constraint, dedupe by number.
delete from public.ambulances a
  using public.ambulances b
  where a.vehicle_number = b.vehicle_number
    and a.id > b.id;

-- ============================================================
-- Demo accounts.
--
-- These accounts are NOT created here — sign up through /auth/signup
-- first, then run the statements below with the real email addresses.
-- Every account defaults to the 'patient' role, so an account must be
-- promoted explicitly before the dispatch console will open.
--
--   -- Dispatcher
--   update public.profiles set role = 'dispatcher'
--    where email = 'dispatch@example.com';
--
--   -- Paramedic, crewed to AMB-01
--   update public.profiles
--      set role = 'paramedic',
--          ambulance_id = (select id from public.ambulances
--                           where vehicle_number = 'AMB-01')
--    where email = 'driver@example.com';
--
--   -- Paramedic, crewed to AMB-02
--   update public.profiles
--      set role = 'paramedic',
--          ambulance_id = (select id from public.ambulances
--                           where vehicle_number = 'AMB-02')
--    where email = 'driver2@example.com';
--
-- To see the dispatch flow without a second device, open an incognito
-- window for the paramedic so patient and crew sessions do not collide.
-- ============================================================