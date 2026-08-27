-- Admin-managed Reviews and Client Cam galleries.
BEGIN;

CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_key TEXT NOT NULL CHECK (gallery_key IN ('reviews', 'client-cam')),
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_images_gallery_order ON public.gallery_images (gallery_key, sort_order, created_at);
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read gallery images" ON public.gallery_images;
CREATE POLICY "Public can read gallery images" ON public.gallery_images FOR SELECT USING (true);
REVOKE INSERT, UPDATE, DELETE ON TABLE public.gallery_images FROM anon, authenticated;

INSERT INTO public.gallery_images (gallery_key, image_url, alt_text, sort_order) VALUES
  ('reviews', '/Reviews page/029544b5-8fd1-41e0-b591-117694ebb124.JPG', 'Client review screenshot 1', 1),
  ('reviews', '/Reviews page/0b243dd0-e729-464b-953e-38db8a788767.JPG', 'Client review screenshot 2', 2),
  ('reviews', '/Reviews page/1316d5f7-8407-4721-8336-d46f28a48b08.JPG', 'Client review screenshot 3', 3),
  ('reviews', '/Reviews page/1bf04f2c-c963-435e-9f94-e57c36ce23db.JPG', 'Client review screenshot 4', 4),
  ('reviews', '/Reviews page/4bbc36f6-a9a6-4df9-9283-a76821df782e.JPG', 'Client review screenshot 5', 5),
  ('reviews', '/Reviews page/5f02d06e-954f-4039-be3c-93673c8d21ae.JPG', 'Client review screenshot 6', 6),
  ('reviews', '/Reviews page/6f027ca0-e0d1-49f4-80ec-b08094143308.JPG', 'Client review screenshot 7', 7),
  ('reviews', '/Reviews page/844194c4-e1a8-4350-98bc-b5f39d5e2180.JPG', 'Client review screenshot 8', 8),
  ('reviews', '/Reviews page/8862a4ec-cc77-42fc-b2e7-5077ca96c8ad.JPG', 'Client review screenshot 9', 9),
  ('reviews', '/Reviews page/8dba76c9-a940-4f3c-8437-92850db10084.JPG', 'Client review screenshot 10', 10),
  ('reviews', '/Reviews page/8e822936-b3f1-451d-acaa-e1dfdbc1eaa6.JPG', 'Client review screenshot 11', 11),
  ('reviews', '/Reviews page/98fc23de-7afd-44ad-b5d4-5c5b517bc6fb.JPG', 'Client review screenshot 12', 12),
  ('reviews', '/Reviews page/a2b525ea-8dcd-4ea9-97ce-dafe255f5bbf.JPG', 'Client review screenshot 13', 13),
  ('reviews', '/Reviews page/a6c31d2c-c5fa-4da2-956e-cec36aa542d4.JPG', 'Client review screenshot 14', 14),
  ('reviews', '/Reviews page/b0e1aeca-47ba-4123-97ba-8a5a19bb1097.JPG', 'Client review screenshot 15', 15),
  ('reviews', '/Reviews page/b7858256-574d-424b-8567-e8ed6823b123.JPG', 'Client review screenshot 16', 16),
  ('reviews', '/Reviews page/bb0c24f3-c044-4f02-8cbd-53ef2b03b6c0.JPG', 'Client review screenshot 17', 17),
  ('reviews', '/Reviews page/bd955ff3-57c7-42cb-bd15-08fa9fd0f17e.JPG', 'Client review screenshot 18', 18),
  ('reviews', '/Reviews page/c1341571-47f5-4781-9b18-7adde0183aef.JPG', 'Client review screenshot 19', 19),
  ('reviews', '/Reviews page/c9a69330-973f-4e99-8e37-943308f10b67.JPG', 'Client review screenshot 20', 20),
  ('reviews', '/Reviews page/ddf69451-a6da-42e4-8532-a386d433c7fd.JPG', 'Client review screenshot 21', 21),
  ('reviews', '/Reviews page/e2d5c3b8-a9a4-4c21-b632-134147f92f5d.JPG', 'Client review screenshot 22', 22),
  ('reviews', '/Reviews page/e6d7b29b-4173-492a-888d-4671ccbfd616.JPG', 'Client review screenshot 23', 23),
  ('reviews', '/Reviews page/f4d4148b-2434-4d1a-9f17-dda2f4b1bb30.JPG', 'Client review screenshot 24', 24)
ON CONFLICT DO NOTHING;

COMMIT;
