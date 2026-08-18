-- Current service pricing and appointment durations.
UPDATE public.services
SET full_price = 560, duration_minutes = 90
WHERE lower(name) LIKE '%afro%';

UPDATE public.services
SET full_price = 650, duration_minutes = 150
WHERE lower(name) = 'ocean curls';
