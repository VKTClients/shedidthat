CREATE TABLE IF NOT EXISTS public.booking_settings (
  singleton_id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (singleton_id = 1),
  display_month DATE NOT NULL DEFAULT DATE '2026-09-01',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.booking_settings (singleton_id, display_month)
VALUES (1, DATE '2026-09-01')
ON CONFLICT (singleton_id) DO NOTHING;

ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.booking_settings FROM anon, authenticated;
