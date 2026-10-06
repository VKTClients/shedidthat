BEGIN;

UPDATE public.services
SET full_price = 650
WHERE name = 'Crochet Afros'
  AND full_price IS DISTINCT FROM 650;

COMMIT;
