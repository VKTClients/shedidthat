-- Fixed R175 deposit, short-hair surcharge support, and removal of drink preference.
ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS short_hair BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.booking_requests DROP CONSTRAINT IF EXISTS booking_requests_payment_choice_check;
ALTER TABLE public.booking_requests DROP CONSTRAINT IF EXISTS booking_requests_amount_due_check;
UPDATE public.booking_requests SET payment_choice = 'DEPOSIT' WHERE payment_choice <> 'DEPOSIT';
ALTER TABLE public.booking_requests ALTER COLUMN payment_choice SET DEFAULT 'DEPOSIT';
ALTER TABLE public.booking_requests ADD CONSTRAINT booking_requests_payment_choice_check CHECK (payment_choice = 'DEPOSIT');
ALTER TABLE public.booking_requests ALTER COLUMN amount_due SET DEFAULT 175;

UPDATE public.services SET deposit_type = 'FIXED', deposit_value = 175;
ALTER TABLE public.booking_requests DROP COLUMN IF EXISTS juice_preference;
