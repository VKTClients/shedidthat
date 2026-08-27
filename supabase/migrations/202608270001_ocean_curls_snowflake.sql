-- Add the Snowflake colour to the Ocean Curls catalogue.
BEGIN;

INSERT INTO public.hair_options (service_id, name, price_delta)
SELECT s.id, 'Snowflake', 0
FROM public.services s
WHERE lower(s.name) = 'ocean curls'
  AND NOT EXISTS (
    SELECT 1
    FROM public.hair_options existing
    WHERE existing.service_id = s.id
      AND lower(existing.name) = 'snowflake'
  );

COMMIT;
