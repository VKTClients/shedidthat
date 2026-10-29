ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS buy_own_hair BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.booking_requests
  DROP CONSTRAINT IF EXISTS booking_requests_amount_due_check;

ALTER TABLE public.booking_requests
  ADD CONSTRAINT booking_requests_amount_due_check
  CHECK (amount_due IN (175, 275) OR (amount_due = 0 AND (own_fibre OR buy_own_hair)));
