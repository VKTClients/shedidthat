BEGIN;

-- Include the individual Afro styles as well as the original collection service.
UPDATE public.services
SET full_price = 650
WHERE is_active = true
  AND name ILIKE '%afro%'
  AND full_price IS DISTINCT FROM 650;

COMMIT;
