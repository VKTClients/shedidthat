-- Add Ariel to the Ocean Curls catalogue and admin-managed product media.
BEGIN;

INSERT INTO public.hair_options (service_id, name, price_delta)
SELECT s.id, 'Ariel', 0
FROM public.services s
WHERE lower(s.name) = 'ocean curls'
  AND NOT EXISTS (
    SELECT 1
    FROM public.hair_options existing
    WHERE existing.service_id = s.id
      AND lower(existing.name) = 'ariel'
  );

INSERT INTO public.site_media (slot_key, image_url, alt_text)
VALUES ('product.ocean-curls.ariel', '/images/Ocean Curls Ariel.png', 'Ocean Curls Ariel')
ON CONFLICT (slot_key) DO NOTHING;

COMMIT;
