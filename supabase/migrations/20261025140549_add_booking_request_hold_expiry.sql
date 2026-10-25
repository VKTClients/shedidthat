-- Store the actual expiration time for each pending booking hold. Historical
-- requests keep the original 24-hour deadline derived from their creation.
ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ;

UPDATE public.booking_requests
SET hold_expires_at = created_at + INTERVAL '24 hours'
WHERE hold_expires_at IS NULL;

ALTER TABLE public.booking_requests
  ALTER COLUMN hold_expires_at SET DEFAULT (now() + INTERVAL '24 hours'),
  ALTER COLUMN hold_expires_at SET NOT NULL;

DROP INDEX IF EXISTS public.idx_booking_requests_pending_created_at;
CREATE INDEX IF NOT EXISTS idx_booking_requests_pending_hold_expires_at
  ON public.booking_requests (status, hold_expires_at)
  WHERE status IN ('REQUESTED', 'POP_UPLOADED');
