
CREATE POLICY "Anyone can read dynamic-qr files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dynamic-qr');

CREATE POLICY "Users can upload to their dynamic-qr folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'dynamic-qr' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their dynamic-qr files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'dynamic-qr' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their dynamic-qr files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'dynamic-qr' AND auth.uid()::text = (storage.foldername(name))[1]);
