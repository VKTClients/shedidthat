-- Add Ruby Curls Brownie to the customer catalogue and admin-managed media.
BEGIN;

INSERT INTO public.services (name, description, duration_minutes, full_price, deposit_type, deposit_value, has_hair_options, image_url)
SELECT 'Ruby Curls', 'Soft, voluminous crochet curls in a warm brownie colour.', 150, 700, 'FIXED', 175, true, '/images/Ruby Curls Brownie.png'
WHERE NOT EXISTS (
  SELECT 1 FROM public.services WHERE lower(name) = 'ruby curls'
);

INSERT INTO public.hair_options (service_id, name, price_delta)
SELECT s.id, 'Brownie', 0
FROM public.services s
WHERE lower(s.name) = 'ruby curls'
  AND NOT EXISTS (
    SELECT 1 FROM public.hair_options existing
    WHERE existing.service_id = s.id AND lower(existing.name) = 'brownie'
  );

INSERT INTO public.site_media (slot_key, image_url, alt_text)
VALUES ('product.ruby-curls.brownie', '/images/Ruby Curls Brownie.png', 'Ruby Curls Brownie')
ON CONFLICT (slot_key) DO NOTHING;

COMMIT;
