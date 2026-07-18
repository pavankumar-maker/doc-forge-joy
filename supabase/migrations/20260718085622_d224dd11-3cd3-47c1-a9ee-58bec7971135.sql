
-- Lock down dynamic_qrs: remove public SELECT, add owner SELECT
DROP POLICY IF EXISTS "Public can view dynamic QRs" ON public.dynamic_qrs;
CREATE POLICY "Owners can view their dynamic QRs"
  ON public.dynamic_qrs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Lock down storage: only owners (folder = user id) can read their files
DROP POLICY IF EXISTS "Anyone can read dynamic-qr files" ON storage.objects;
CREATE POLICY "Owners can read their dynamic-qr files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'dynamic-qr' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Revoke EXECUTE on trigger-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
