
-- Fix assignments wrongly reset to 'offen' by AssignmentDialog delete-all bug
-- Assignments with reviews + all attachments approved → erfolgreich
UPDATE order_assignments SET status = 'erfolgreich' WHERE id IN (
  '65304896-7931-4ea2-9262-ecdc5073e966',
  '42fb7661-a115-4244-bfe0-47a3af1992aa',
  'd9388de5-35b9-4001-9085-3acf7726548f',
  'efed2e89-fd28-43c9-bc6a-176a18da0537',
  '713d2fa2-3212-4a74-8ad8-334771eb8935',
  '08960e23-64ef-4107-82b3-ce21025a9639',
  '9fd182a6-87aa-4725-b1a8-21121073f45d',
  'c4dbf754-ee26-4ffd-97ef-4e20ca6118c7',
  'dae77c88-fc94-4a44-aed9-9207ae85bded',
  '5647fd3d-52b8-4d36-80ba-57631dc411d1'
);

-- Assignments with reviews but pending attachments → in_pruefung
UPDATE order_assignments SET status = 'in_pruefung' WHERE id IN (
  'f766c707-4a03-4adc-b6ea-3341096314ca',
  '62283f90-0355-465e-9732-cf6c64cbd628',
  '42b50a1b-9c3f-4df7-b1c7-519fd074d579',
  '2a018bfd-4b86-4728-a35a-0e7e224d02f3',
  '5da59f2a-c488-4ab5-8c6e-c4b9605f6bdd'
);
