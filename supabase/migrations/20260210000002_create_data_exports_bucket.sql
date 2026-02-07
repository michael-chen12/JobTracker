-- Create storage bucket for data exports
-- Ticket #26: Export & GDPR Compliance

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'data-exports',
  'data-exports',
  false,
  52428800,
  ARRAY['application/json', 'text/csv']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Users can read their own exports
CREATE POLICY "Users can read own data exports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'data-exports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Service role can manage all exports (for server action uploads)
CREATE POLICY "Service role can manage data exports"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'data-exports');
