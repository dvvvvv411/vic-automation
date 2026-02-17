
-- Add resume_url column to applications
ALTER TABLE public.applications ADD COLUMN resume_url text;

-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public) VALUES ('application-documents', 'application-documents', true);

-- Allow anyone to upload application documents
CREATE POLICY "Anyone can upload application documents"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'application-documents');

-- Allow anyone to read application documents
CREATE POLICY "Anyone can read application documents"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'application-documents');
