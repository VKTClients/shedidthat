-- Pending booking requests hold a slot for 24 hours. The application marks
-- overdue requests CANCELLED before availability checks and new inserts so
-- booking_requests_active_time_exclusion no longer reserves their time.
CREATE INDEX IF NOT EXISTS idx_booking_requests_pending_created_at
  ON public.booking_requests (status, created_at)
  WHERE status IN ('REQUESTED', 'POP_UPLOADED');
