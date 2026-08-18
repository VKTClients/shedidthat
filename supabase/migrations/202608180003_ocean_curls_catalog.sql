-- Add Ocean Curls with colour variants and remove Standard Cornrows safely.
BEGIN;

-- Preserve booking history: stop with a clear error instead of deleting linked bookings.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.booking_requests br
    JOIN public.services s ON s.id = br.service_id
    WHERE lower(s.name) IN ('standard cornrows', 'standard cornrows (10)')
  ) THEN
    RAISE EXCEPTION 'Standard Cornrows has booking history and cannot be deleted safely. Archive or reassign those bookings first.';
  END IF;
END $$;

DELETE FROM public.hair_options
WHERE service_id IN (
  SELECT id FROM public.services
  WHERE lower(name) IN ('standard cornrows', 'standard cornrows (10)')
);

DELETE FROM public.services
WHERE lower(name) IN ('standard cornrows', 'standard cornrows (10)');

-- Update an existing Ocean Curls service, if present.
UPDATE public.services
SET
  name = 'Ocean Curls',
  description = 'Soft, flowing crochet curls available in a selection of beautiful colours.',
  full_price = 650,
  deposit_type = 'FIXED',
  deposit_value = 175,
  has_hair_options = true
WHERE lower(name) = 'ocean curls';

-- Otherwise create it.
INSERT INTO public.services (
  name, description, duration_minutes, full_price,
  deposit_type, deposit_value, has_hair_options
)
SELECT
  'Ocean Curls',
  'Soft, flowing crochet curls available in a selection of beautiful colours.',
  120,
  650,
  'FIXED',
  175,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.services WHERE lower(name) = 'ocean curls'
);

-- Add the requested colours without duplicating variants if this migration is rerun.
INSERT INTO public.hair_options (service_id, name, price_delta)
SELECT s.id, colour.name, 0
FROM public.services s
CROSS JOIN (VALUES
  ('Blondie'),
  ('Brownie'),
  ('Goldie'),
  ('Black'),
  ('Ginger')
) AS colour(name)
WHERE lower(s.name) = 'ocean curls'
  AND NOT EXISTS (
    SELECT 1
    FROM public.hair_options existing
    WHERE existing.service_id = s.id
      AND lower(existing.name) = lower(colour.name)
  );

COMMIT;
