ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS secondary_hair_option_id UUID REFERENCES public.hair_options(id);

COMMENT ON COLUMN public.booking_requests.secondary_hair_option_id IS
  'Optional backup hair colour selected by the customer.';
