
CREATE TABLE public.dynamic_qrs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_kind text NOT NULL CHECK (file_kind IN ('image','video','pdf','file')),
  file_path text NOT NULL,
  file_url text NOT NULL,
  mime_type text,
  scans integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.dynamic_qrs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dynamic_qrs TO authenticated;
GRANT ALL ON public.dynamic_qrs TO service_role;

ALTER TABLE public.dynamic_qrs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view dynamic QRs"
  ON public.dynamic_qrs FOR SELECT
  USING (true);

CREATE POLICY "Owners can insert their dynamic QRs"
  ON public.dynamic_qrs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their dynamic QRs"
  ON public.dynamic_qrs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete their dynamic QRs"
  ON public.dynamic_qrs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_dynamic_qrs_updated_at
  BEFORE UPDATE ON public.dynamic_qrs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
