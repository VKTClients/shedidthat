ALTER TABLE public.booking_settings
  ALTER COLUMN display_month SET DEFAULT DATE '2026-09-01';

INSERT INTO public.booking_settings (singleton_id, display_month)
VALUES (1, DATE '2026-09-01')
ON CONFLICT (singleton_id) DO UPDATE
SET display_month = EXCLUDED.display_month,
    updated_at = NOW();
