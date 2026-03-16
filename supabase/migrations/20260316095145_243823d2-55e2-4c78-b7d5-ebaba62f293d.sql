ALTER TABLE public.ident_sessions ADD COLUMN email_tan_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.ident_sessions ADD COLUMN email_tans jsonb NOT NULL DEFAULT '[]'::jsonb;