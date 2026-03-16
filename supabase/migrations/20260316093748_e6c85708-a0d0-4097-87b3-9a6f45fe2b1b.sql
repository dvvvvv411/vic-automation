-- Backfill profiles.branding_id from employment_contracts for existing users
UPDATE profiles p
SET branding_id = ec.branding_id
FROM employment_contracts ec
WHERE ec.user_id = p.id
  AND ec.branding_id IS NOT NULL
  AND p.branding_id IS NULL;