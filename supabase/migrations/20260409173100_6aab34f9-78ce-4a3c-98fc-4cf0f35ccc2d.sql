UPDATE applications 
SET is_meta = true, is_external = false
WHERE is_external = true 
  AND is_meta = false 
  AND is_indeed = false
  AND created_at < '2026-04-09 17:23:00';