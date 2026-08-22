-- Repair environments where the Cluster Lashes application change was deployed
-- before its booking_requests column migration was applied.
ALTER TABLE public.booking_requests
ADD COLUMN IF NOT EXISTS cluster_lashes BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.booking_requests.cluster_lashes IS
  'Whether the customer selected the paid Cluster Lashes booking add-on.';

NOTIFY pgrst, 'reload schema';
