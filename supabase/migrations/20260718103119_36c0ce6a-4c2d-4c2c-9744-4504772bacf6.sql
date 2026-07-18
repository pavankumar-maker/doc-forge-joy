REVOKE EXECUTE ON FUNCTION public.record_scan(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_scan(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_scan(uuid, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_scan(uuid, text, text) TO service_role;