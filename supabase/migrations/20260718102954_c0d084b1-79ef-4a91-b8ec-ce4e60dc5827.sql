UPDATE public.dynamic_qrs
SET file_url = 'https://doc-forge-joy.lovable.app/d/' || id::text
WHERE file_url IS NOT NULL
  AND file_url <> ''
  AND file_url !~ '^https://doc-forge-joy\.lovable\.app/d/[0-9a-fA-F-]{36}$';