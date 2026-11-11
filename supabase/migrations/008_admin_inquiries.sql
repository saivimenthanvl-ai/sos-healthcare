-- 008_admin_inquiries.sql
-- Create admin_inquiries table with server-side validation and Row-Level Security

CREATE TABLE IF NOT EXISTS admin_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'general',
    'hospital_correction',
    'appointment_assistance',
    'privacy_data_request',
    'account_assistance'
  )),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'IN_REVIEW', 'RESOLVED', 'CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  resolved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE admin_inquiries ENABLE ROW LEVEL SECURITY;

-- Policy 1: Any user (including anonymous) can insert inquiries via the application
CREATE POLICY "Anyone can submit an inquiry"
  ON admin_inquiries
  FOR INSERT
  WITH CHECK (true);

-- Policy 2: Admins can view all inquiries
CREATE POLICY "Admins can view all inquiries"
  ON admin_inquiries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role_v2 = 'ADMIN' OR profiles.role = 'admin')
    )
  );

-- Policy 3: Admins can update inquiries
CREATE POLICY "Admins can update inquiries"
  ON admin_inquiries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role_v2 = 'ADMIN' OR profiles.role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role_v2 = 'ADMIN' OR profiles.role = 'admin')
    )
  );

-- Policy 4: Authenticated users can view their own submitted inquiries
CREATE POLICY "Users can view their own inquiries"
  ON admin_inquiries
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- Index for speedy queries by status, category and reference
CREATE INDEX IF NOT EXISTS idx_admin_inquiries_status ON admin_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_admin_inquiries_created_at ON admin_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_inquiries_ref ON admin_inquiries(reference_code);
