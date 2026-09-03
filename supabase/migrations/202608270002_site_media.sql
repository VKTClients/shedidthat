-- Admin-managed website image slots and public image storage.
BEGIN;

CREATE TABLE IF NOT EXISTS public.site_media (
  slot_key TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read site media" ON public.site_media;
CREATE POLICY "Public can read site media" ON public.site_media FOR SELECT USING (true);
REVOKE INSERT, UPDATE, DELETE ON TABLE public.site_media FROM anon, authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-media', 'site-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO public.site_media (slot_key, image_url, alt_text) VALUES
  ('brand.logo', '/images/logo.png', 'Website logo'),
  ('homepage.hero', '/images/hero.jpg', 'Homepage hero'),
  ('homepage.about', '/images/blondehomepage.jpeg', 'Homepage about image'),
  ('product.ocean-curls.blondie', '/images/Ocean Curls Blondie.jpeg', 'Ocean Curls Blondie'),
  ('product.ocean-curls.brownie', '/images/Ocean Curls Brownie.jpeg', 'Ocean Curls Brownie'),
  ('product.ocean-curls.goldie', '/images/Ocean Curls Goldie.jpeg', 'Ocean Curls Goldie'),
  ('product.ocean-curls.black', '/images/Ocean Curls Black.jpeg', 'Ocean Curls Black'),
  ('product.ocean-curls.ginger', '/images/Ocean Curls Ginger.jpeg', 'Ocean Curls Ginger'),
  ('product.ocean-curls.ariel', '/images/Ocean Curls Ariel.png', 'Ocean Curls Ariel'),
  ('product.ocean-curls.snowflake', '/images/Ocean Curls Snowflake.png', 'Ocean Curls Snowflake'),
  ('product.crochet-afro.brownie', '/images/brownie.jpg', 'Brownie Afro'),
  ('product.crochet-afro.black', '/images/black afro.jpg', 'Black Afro'),
  ('product.crochet-afro.goldie', '/images/goldie.jpg', 'Goldie Afro'),
  ('booking.cluster-lashes-1', '/images/cluster-lashes-1.png', 'Cluster lashes example 1'),
  ('booking.cluster-lashes-2', '/images/cluster-lashes-2.png', 'Cluster lashes example 2')
ON CONFLICT (slot_key) DO NOTHING;

COMMIT;
