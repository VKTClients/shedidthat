-- ============================================
-- SheDidThat — Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SERVICES
-- ============================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  full_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  deposit_type TEXT NOT NULL DEFAULT 'FIXED' CHECK (deposit_type IN ('PERCENTAGE', 'FIXED')),
  deposit_value NUMERIC(10,2) NOT NULL DEFAULT 175,
  has_hair_options BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- HAIR OPTIONS
-- ============================================
CREATE TABLE hair_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- ============================================
-- BOOKING REQUESTS
-- ============================================
CREATE TABLE booking_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  service_id UUID NOT NULL REFERENCES services(id),
  hair_option_id UUID REFERENCES hair_options(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  payment_choice TEXT NOT NULL DEFAULT 'DEPOSIT' CHECK (payment_choice = 'DEPOSIT'),
  amount_due NUMERIC(10,2) NOT NULL DEFAULT 175 CHECK (amount_due = 175),
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  short_hair BOOLEAN NOT NULL DEFAULT false,
  cluster_lashes BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'POP_UPLOADED', 'CONFIRMED', 'REJECTED', 'CANCELLED')),
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- PAYMENT PROOFS
-- ============================================
CREATE TABLE payment_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_request_id UUID NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  reference_used TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  review_note TEXT
);

-- ============================================
-- CONFIRMED BOOKINGS
-- ============================================
CREATE TABLE confirmed_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_request_id UUID NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exactly one Supabase Auth user may own the admin area.
CREATE TABLE admin_users (
  singleton_id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (singleton_id = 1),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent overlapping confirmed bookings
CREATE OR REPLACE FUNCTION check_no_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM confirmed_bookings
    WHERE id != NEW.id
      AND start_time < NEW.end_time
      AND end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'Overlapping confirmed booking exists';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_overlap
  BEFORE INSERT OR UPDATE ON confirmed_bookings
  FOR EACH ROW EXECUTE FUNCTION check_no_overlap();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_booking_requests_status ON booking_requests(status);
CREATE INDEX idx_booking_requests_start_time ON booking_requests(start_time);
CREATE INDEX idx_confirmed_bookings_start_time ON confirmed_bookings(start_time);
CREATE INDEX idx_confirmed_bookings_end_time ON confirmed_bookings(end_time);
CREATE INDEX idx_payment_proofs_booking ON payment_proofs(booking_request_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE hair_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmed_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE admin_users FROM anon, authenticated;

-- Public read for services and hair_options
CREATE POLICY "Public can read services" ON services FOR SELECT USING (true);
CREATE POLICY "Public can read hair_options" ON hair_options FOR SELECT USING (true);

-- All customer, booking, proof, and admin records are server-only. The service
-- role bypasses RLS and therefore must never be exposed to the browser.

-- ============================================
-- SEED DATA — Sample Services
-- ============================================
INSERT INTO services (name, description, duration_minutes, full_price, deposit_type, deposit_value, has_hair_options) VALUES
  ('Crochet Afros', 'A textured crochet afro with a natural-looking, confident finish.', 90, 560, 'FIXED', 175, true),
  ('Ocean Curls', 'Soft, flowing crochet curls available in a selection of beautiful colours.', 150, 650, 'FIXED', 175, true);

-- Seed hair options for services that have them
INSERT INTO hair_options (service_id, name, price_delta)
SELECT id, 'Bring Your Own Hair', 0 FROM services WHERE name = 'Crochet Afros'
UNION ALL
SELECT id, 'Salon Synthetic Hair', 150 FROM services WHERE name = 'Crochet Afros'
UNION ALL
SELECT id, 'Salon Human Hair', 400 FROM services WHERE name = 'Crochet Afros'
UNION ALL
SELECT id, 'Not Sure / Consult Me', 0 FROM services WHERE name = 'Crochet Afros';

INSERT INTO hair_options (service_id, name, price_delta)
SELECT services.id, colours.name, 0
FROM services
CROSS JOIN (VALUES ('Blondie'), ('Brownie'), ('Goldie'), ('Black'), ('Ginger')) AS colours(name)
WHERE services.name = 'Ocean Curls';

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Run this separately or via Supabase dashboard:
-- Create a private bucket called "payment-proofs"
-- INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false);

