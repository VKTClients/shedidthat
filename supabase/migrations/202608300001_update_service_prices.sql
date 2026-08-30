-- Current service pricing as of 30 August 2026.
UPDATE public.services
SET full_price = 750
WHERE lower(name) = 'ocean curls';

UPDATE public.services
SET full_price = 600
WHERE lower(name) LIKE '%afro%';
