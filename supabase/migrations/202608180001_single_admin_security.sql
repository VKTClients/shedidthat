-- Production hardening: one admin account and private customer data.
CREATE TABLE IF NOT EXISTS public.admin_users (
  singleton_id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (singleton_id = 1),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_users FROM anon, authenticated;

DROP POLICY IF EXISTS "Service role full access services" ON public.services;
DROP POLICY IF EXISTS "Service role full access hair_options" ON public.hair_options;
DROP POLICY IF EXISTS "Service role full access booking_requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Service role full access payment_proofs" ON public.payment_proofs;
DROP POLICY IF EXISTS "Service role full access confirmed_bookings" ON public.confirmed_bookings;
DROP POLICY IF EXISTS "Public can read confirmed_bookings" ON public.confirmed_bookings;
DROP POLICY IF EXISTS "Public can read booking_requests" ON public.booking_requests;

-- Payment proofs contain financial/customer information and must not be public.
UPDATE storage.buckets SET public = false WHERE id = 'payment-proofs';
