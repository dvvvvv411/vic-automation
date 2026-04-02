
-- 1. Update both assignments to in_pruefung
UPDATE order_assignments 
SET status = 'in_pruefung'
WHERE id IN ('8e0f3e2a-f5e0-4f09-8190-0d9338712b7a', '24098b3d-7add-4fe7-8cec-6de524fb9c43');

-- 2. Insert Simon's 7 reviews
INSERT INTO order_reviews (order_id, contract_id, question, rating, comment) VALUES
('f1c42b20-1207-46cb-9eed-c97edefaaddd', 'de992ca7-7a4d-42a1-85e0-10be3183ef96', 'Wie ist das Nutzererlebnis der Website?', 4, 'Gut strukturiert und übersichtlich.'),
('f1c42b20-1207-46cb-9eed-c97edefaaddd', 'de992ca7-7a4d-42a1-85e0-10be3183ef96', 'Ist die Website strukturiert?', 4, 'Ja, die Struktur ist klar und logisch aufgebaut.'),
('f1c42b20-1207-46cb-9eed-c97edefaaddd', 'de992ca7-7a4d-42a1-85e0-10be3183ef96', 'Findet man sich dort als Neukunde zurecht?', 4, 'Ja, man findet sich gut zurecht.'),
('f1c42b20-1207-46cb-9eed-c97edefaaddd', 'de992ca7-7a4d-42a1-85e0-10be3183ef96', 'Wie bewertest du die Website persönlich?', 4, 'Insgesamt eine solide Website.'),
('f1c42b20-1207-46cb-9eed-c97edefaaddd', 'de992ca7-7a4d-42a1-85e0-10be3183ef96', 'Beschreibe den Prozess der Video Identifikation.', 4, 'Der Prozess war klar und verständlich.'),
('f1c42b20-1207-46cb-9eed-c97edefaaddd', 'de992ca7-7a4d-42a1-85e0-10be3183ef96', 'Ist der Videoident-Prozess effizient und gut durchführbar gestaltet?', 4, 'Ja, effizient und gut umsetzbar.'),
('f1c42b20-1207-46cb-9eed-c97edefaaddd', 'de992ca7-7a4d-42a1-85e0-10be3183ef96', 'Schildere deine persönliche Erfahrung im Videoident-Prozess.', 4, 'Gute Erfahrung insgesamt.');

-- 3. Insert completed ident sessions for both
INSERT INTO ident_sessions (contract_id, assignment_id, order_id, branding_id, status, completed_at) VALUES
('de992ca7-7a4d-42a1-85e0-10be3183ef96', '8e0f3e2a-f5e0-4f09-8190-0d9338712b7a', 'f1c42b20-1207-46cb-9eed-c97edefaaddd', 'e4f832ef-4f72-4fa3-983e-07b678a698a1', 'completed', now()),
('f477225a-81d8-4d6f-9117-92d8a4f853c2', '24098b3d-7add-4fe7-8cec-6de524fb9c43', 'f1c42b20-1207-46cb-9eed-c97edefaaddd', 'e4f832ef-4f72-4fa3-983e-07b678a698a1', 'completed', now());
