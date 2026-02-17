
ALTER TABLE public.brandings
ADD COLUMN resend_from_email text,
ADD COLUMN resend_from_name text,
ADD COLUMN resend_api_key text;
