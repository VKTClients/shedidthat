ALTER TABLE public.booking_requests
ADD COLUMN IF NOT EXISTS cluster_lashes BOOLEAN NOT NULL DEFAULT false;
