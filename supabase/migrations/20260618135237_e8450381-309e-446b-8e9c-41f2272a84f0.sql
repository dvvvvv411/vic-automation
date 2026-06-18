
CREATE POLICY "Kunde can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND is_kunde(auth.uid())
  AND (
    NOT user_has_any_branding(auth.uid())
    OR (storage.foldername(name))[1] IN (
      SELECT contracts_for_branding_ids(auth.uid())::text
    )
  )
);

CREATE POLICY "Kunde can read chat attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND is_kunde(auth.uid())
  AND (
    NOT user_has_any_branding(auth.uid())
    OR (storage.foldername(name))[1] IN (
      SELECT contracts_for_branding_ids(auth.uid())::text
    )
  )
);
