-- Remove French Curl Locs from the service catalogue and enforce the R560
-- Crochet Afro price across every Afro service.

BEGIN;

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

UPDATE public.services
SET full_price = 560
WHERE name ILIKE '%afro%'
  AND full_price IS DISTINCT FROM 560;

-- Archive instead of deleting so existing booking history keeps its service.
UPDATE public.services
SET is_active = false
WHERE name ILIKE '%french%curl%loc%';

-- Guarantee that every Ocean Curls colour is available in the booking flow.
INSERT INTO public.hair_options (service_id, name, price_delta)
SELECT service.id, colour.name, 0
FROM public.services AS service
CROSS JOIN (VALUES ('Blondie'), ('Brownie'), ('Goldie'), ('Black'), ('Ginger')) AS colour(name)
WHERE service.name ILIKE '%ocean curl%'
  AND NOT EXISTS (
    SELECT 1
    FROM public.hair_options AS existing
    WHERE existing.service_id = service.id
      AND lower(existing.name) = lower(colour.name)
  );

COMMIT;
