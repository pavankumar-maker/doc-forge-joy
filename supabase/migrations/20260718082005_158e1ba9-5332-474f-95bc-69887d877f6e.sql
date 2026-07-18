
-- Allow file-less dynamic QRs (multi-link, vcard)
ALTER TABLE public.dynamic_qrs
  ALTER COLUMN file_path DROP NOT NULL,
  ALTER COLUMN file_url DROP NOT NULL;

ALTER TABLE public.dynamic_qrs DROP CONSTRAINT IF EXISTS dynamic_qrs_file_kind_check;
ALTER TABLE public.dynamic_qrs ADD CONSTRAINT dynamic_qrs_file_kind_check
  CHECK (file_kind IN ('image','video','pdf','file','multilink','vcard'));

ALTER TABLE public.dynamic_qrs ADD COLUMN IF NOT EXISTS content jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Scan events log
CREATE TABLE public.scan_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_id uuid NOT NULL REFERENCES public.dynamic_qrs(id) ON DELETE CASCADE,
  referrer text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX scan_events_qr_id_idx ON public.scan_events(qr_id, created_at DESC);

GRANT SELECT ON public.scan_events TO authenticated;
GRANT ALL ON public.scan_events TO service_role;

ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their scan events"
  ON public.scan_events FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dynamic_qrs q WHERE q.id = qr_id AND q.user_id = auth.uid()));

-- Public RPC to record a scan
CREATE OR REPLACE FUNCTION public.record_scan(_qr_id uuid, _referrer text DEFAULT NULL, _user_agent text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.dynamic_qrs WHERE id = _qr_id) THEN
    RETURN;
  END IF;
  INSERT INTO public.scan_events (qr_id, referrer, user_agent)
  VALUES (_qr_id, LEFT(COALESCE(_referrer,''), 500), LEFT(COALESCE(_user_agent,''), 500));
  UPDATE public.dynamic_qrs SET scans = scans + 1 WHERE id = _qr_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_scan(uuid, text, text) TO anon, authenticated;
