-- Pending requests reserve their slots until explicitly denied/cancelled by admin.
-- Keep the legacy column for compatibility with older deployments.
ALTER TABLE public.booking_requests
  ALTER COLUMN hold_expires_at SET DEFAULT 'infinity'::timestamptz;

UPDATE public.booking_requests
SET hold_expires_at = 'infinity'::timestamptz
WHERE status IN ('REQUESTED', 'POP_UPLOADED');
