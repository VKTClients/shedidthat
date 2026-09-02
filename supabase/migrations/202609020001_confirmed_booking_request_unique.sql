-- A booking request can only produce one confirmed calendar hold.
-- This keeps repeated admin clicks or concurrent approval requests from
-- creating duplicate calendar entries for the same customer booking.
CREATE UNIQUE INDEX IF NOT EXISTS idx_confirmed_bookings_request_unique
  ON public.confirmed_bookings (booking_request_id);
