-- Customer-supplied fibre option and database-level protection for active holds.
ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS own_fibre BOOLEAN NOT NULL DEFAULT false;

-- A request reserves its time as soon as it is created. This exclusion constraint
-- closes the race where two customers submit the same overlapping slot together.
ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS booking_time_range TSTZRANGE
  GENERATED ALWAYS AS (tstzrange(start_time, end_time, '[)')) STORED;

ALTER TABLE public.booking_requests
  DROP CONSTRAINT IF EXISTS booking_requests_active_time_exclusion;

ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_active_time_exclusion
  EXCLUDE USING gist (booking_time_range WITH &&)
  WHERE (status IN ('REQUESTED', 'POP_UPLOADED'));
