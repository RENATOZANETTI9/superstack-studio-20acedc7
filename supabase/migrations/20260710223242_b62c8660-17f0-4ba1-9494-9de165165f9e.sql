CREATE POLICY "Authenticated can view mimo-tiers images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'mimo-tiers');

CREATE POLICY "Authenticated can upload mimo-tiers images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mimo-tiers');

CREATE POLICY "Authenticated can update mimo-tiers images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'mimo-tiers');

CREATE POLICY "Authenticated can delete mimo-tiers images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'mimo-tiers');
