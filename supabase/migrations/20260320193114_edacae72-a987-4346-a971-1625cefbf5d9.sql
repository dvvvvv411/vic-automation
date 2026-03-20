-- Drop existing admin-only policies on branding-logos
DROP POLICY IF EXISTS "Admins can upload branding logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update branding logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete branding logos" ON storage.objects;

-- Recreate with admin + kunde access
CREATE POLICY "Admins and kunden can upload branding logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'branding-logos'
  AND (has_role(auth.uid(), 'admin') OR is_kunde(auth.uid()))
);

CREATE POLICY "Admins and kunden can update branding logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'branding-logos'
  AND (has_role(auth.uid(), 'admin') OR is_kunde(auth.uid()))
);

CREATE POLICY "Admins and kunden can delete branding logos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'branding-logos'
  AND (has_role(auth.uid(), 'admin') OR is_kunde(auth.uid()))
);