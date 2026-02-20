-- Update Stefan Hofmann's appointment from 10:30 to 10:40
UPDATE interview_appointments
SET appointment_time = '10:40:00'
WHERE id = '87610176-d3d1-4f45-ad70-6bad59347693';

-- Block the 10:40 slot on 2026-03-04
INSERT INTO schedule_blocked_slots (blocked_date, blocked_time, reason)
VALUES ('2026-03-04', '10:40:00', 'Bewerbungsgespräch Stefan Hofmann');