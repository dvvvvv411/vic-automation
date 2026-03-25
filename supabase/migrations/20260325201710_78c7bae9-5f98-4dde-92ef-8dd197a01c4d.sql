ALTER TABLE interview_appointments
ADD COLUMN probetag_invite_count integer NOT NULL DEFAULT 0,
ADD COLUMN probetag_invite_timestamps jsonb NOT NULL DEFAULT '[]'::jsonb;