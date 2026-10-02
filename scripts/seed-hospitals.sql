-- ============================================================
-- Seed Data: Sample Hospitals
-- Run this after applying the main schema.sql
-- ============================================================

INSERT INTO hospitals (name, address, phone, latitude, longitude, emergency_department, icu_beds, total_beds, rating) VALUES
  ('City General Hospital', '1247 Main St, Springfield', '+1-555-0101', 37.7749, -122.4194, true, 12, 250, 4.5),
  ('Mercy Medical Center', '4500 Geary Blvd, San Francisco', '+1-555-0102', 37.7840, -122.4540, true, 8, 180, 4.3),
  ('St. Mary''s Hospital', '2550 Van Ness Ave, San Francisco', '+1-555-0103', 37.8044, -122.4324, true, 15, 300, 4.7),
  ('Kaiser Permanente Medical Center', '2425 Samaritan Dr, San Jose', '+1-555-0104', 37.3359, -121.8945, true, 20, 400, 4.8),
  ('UCSF Medical Center', '505 Parnassus Ave, San Francisco', '+1-555-0105', 37.7626, -122.4580, true, 30, 500, 4.9),
  ('Sutter Health', '2333 Buchanan St, San Francisco', '+1-555-0106', 37.7860, -122.4280, true, 10, 200, 4.2),
  ('Alta Bates Summit Medical Center', '1600 Ashby Ave, Berkeley', '+1-555-0107', 37.8509, -122.2730, true, 6, 150, 3.8),
  ('Kaiser Permanente Oakland Medical Center', '3900 Broadway, Oakland', '+1-555-0108', 37.8007, -122.2664, true, 18, 350, 4.4),
  ('Marin General Hospital', '2500 East Blithesdale Ave, Corte Madera', '+1-555-0109', 37.9268, -122.5270, true, 9, 220, 4.6),
  ('Novato Community Hospital', '200 Medical Plaza Dr, Novato', '+1-555-0110', 38.1072, -122.6931, true, 5, 120, 4.1),
  ('John Muir Health', '2550 Piedmont Ave, Walnut Creek', '+1-555-0111', 37.9127, -122.0438, true, 14, 280, 4.5),
  ('Contra Costa Regional Medical Center', '2150 Refectory Dr, Concord', '+1-555-0112', 38.0193, -122.0197, true, 7, 160, 4.0),
  ('Vallejo Community Hospital', '1000 Nut Tree Rd, Vallejo', '+1-555-0113', 38.0721, -122.2443, true, 4, 100, 3.7),
  ('Napa Valley Hospital', '2700 N Retreat Rd, Napa', '+1-555-0114', 38.5123, -122.2991, true, 6, 180, 4.2),
  ('Queen of the Valley Medical Center', '1800 N Lemoire Rd, Napa', '+1-555-0115', 38.5777, -122.2954, true, 11, 240, 4.4),
  ('Petaluma Valley Hospital', '1500 N McDowell Blvd, Petaluma', '+1-555-0116', 38.2314, -122.6316, true, 3, 90, 3.9),
  ('Santa Rosa Memorial Hospital', '1701 Montgomery Dr, Santa Rosa', '+1-555-0117', 38.4565, -122.7182, true, 12, 210, 4.3),
  ('Heineman Plumas District Hospital', '1900 Hospital Rd, Quincy', '+1-555-0118', 39.9352, -121.1508, true, 2, 50, 3.5),
  ('Rideout Hospital', '1920 Century Park Dr, Redding', '+1-555-0119', 40.5544, -122.3788, true, 8, 140, 4.0),
  ('Shasta Regional Medical Center', '2155 Highland Dr, Redding', '+1-555-0120', 40.6011, -122.3476, true, 9, 170, 4.1);

-- ============================================================
-- Seed Data: Sample Ambulances
-- ============================================================
INSERT INTO ambulances (driver_name, vehicle_number, latitude, longitude, status) VALUES
  ('Mike Rodriguez', 'AMB-001', 37.7858, -122.4336, 'available'),
  ('Sarah Chen', 'AMB-002', 37.7694, -122.4283, 'available'),
  ('James Wilson', 'AMB-003', 37.7749, -122.4294, 'available'),
  ('Maria Santos', 'AMB-004', 37.7580, -122.4425, 'available'),
  ('David Kim', 'AMB-005', 37.7688, -122.4277, 'available'),
  ('Lisa Thompson', 'AMB-006', 37.7895, -122.4148, 'available'),
  ('Robert Garcia', 'AMB-007', 37.7771, -122.4255, 'available'),
  ('Jennifer Lee', 'AMB-008', 37.7603, -122.4345, 'available');

-- ============================================================
-- Seed Data: Sample Emergency Contacts (for a demo user)
-- NOTE: Replace the user_id with a real user ID from auth.users
-- ============================================================
-- INSERT INTO emergency_contacts (user_id, name, phone, relationship, notification_method) VALUES
--   ('YOUR_USER_ID', 'Emergency Contact 1', '+1-555-9999', 'Spouse', 'sms'),
--   ('YOUR_USER_ID', 'Emergency Contact 2', '+1-555-8888', 'Parent', 'call');
