-- Add Mrs Copper without changing existing colours, prices, or appointments.
BEGIN;

INSERT INTO public.hair_options (service_id, name, price_delta)
SELECT s.id, 'Mrs Copper', 0
FROM public.services s
WHERE lower(s.name) = 'ocean curls'
  AND NOT EXISTS (
    SELECT 1 FROM public.hair_options existing
    WHERE existing.service_id = s.id AND lower(existing.name) = 'mrs copper'
  );

INSERT INTO public.site_media (slot_key, image_url, alt_text)
VALUES ('product.ocean-curls.mrs-copper', '/images/Ocean Curls Mrs Copper.png', 'Mrs Copper: A warm mix of ginger and brownie tones.')
ON CONFLICT (slot_key) DO NOTHING;

COMMIT;
