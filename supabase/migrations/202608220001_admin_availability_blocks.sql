CREATE TABLE IF NOT EXISTS public.availability_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT availability_blocks_valid_range CHECK (end_time > start_time)
);

ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.availability_blocks FROM anon, authenticated;
CREATE INDEX IF NOT EXISTS idx_availability_blocks_start_time ON public.availability_blocks(start_time);

-- Preserve the existing request that the current next calendar week is fully booked,
-- while making every blocked slot removable from the admin Availability screen.
WITH next_week AS (
  SELECT (date_trunc('week', CURRENT_DATE)::date + INTERVAL '7 days')::date AS start_date
), next_week_days AS (
  SELECT generate_series(start_date, start_date + 5, INTERVAL '1 day')::date AS day
  FROM next_week
), next_week_slots AS (
  SELECT day, generate_series(0, 17) AS slot_index
  FROM next_week_days
)
INSERT INTO public.availability_blocks (start_time, end_time, reason)
SELECT
  ((day + TIME '07:00' + slot_index * INTERVAL '30 minutes') AT TIME ZONE 'Africa/Johannesburg'),
  ((day + TIME '07:30' + slot_index * INTERVAL '30 minutes') AT TIME ZONE 'Africa/Johannesburg'),
  'Next week booked out'
FROM next_week_slots;
