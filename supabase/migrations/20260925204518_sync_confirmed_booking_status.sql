-- Repair historical rows where a confirmed calendar hold exists but the
-- request was left in a pending state.
UPDATE public.booking_requests AS request
SET status = 'CONFIRMED'
FROM public.confirmed_bookings AS confirmed
WHERE confirmed.booking_request_id = request.id
  AND request.status IN ('REQUESTED', 'POP_UPLOADED');

UPDATE public.payment_proofs AS proof
SET verification_status = 'APPROVED'
FROM public.confirmed_bookings AS confirmed
WHERE confirmed.booking_request_id = proof.booking_request_id
  AND proof.verification_status = 'PENDING';

-- Keep the booking ledger synchronized whenever a confirmed hold is created.
-- The upload endpoint also performs a conditional status update so a proof
-- finishing concurrently cannot downgrade CONFIRMED back to POP_UPLOADED.
CREATE OR REPLACE FUNCTION public.sync_confirmed_booking_request_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.booking_requests
  SET status = 'CONFIRMED'
  WHERE id = NEW.booking_request_id
    AND status IN ('REQUESTED', 'POP_UPLOADED');

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_confirmed_booking_request_status() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sync_confirmed_booking_request_status
  ON public.confirmed_bookings;

CREATE TRIGGER sync_confirmed_booking_request_status
  AFTER INSERT ON public.confirmed_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_confirmed_booking_request_status();
