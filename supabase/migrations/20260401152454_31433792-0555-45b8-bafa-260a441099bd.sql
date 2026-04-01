
ALTER TABLE ident_sessions ALTER COLUMN assignment_id DROP NOT NULL;
ALTER TABLE ident_sessions ALTER COLUMN order_id DROP NOT NULL;

ALTER TABLE ident_sessions
  DROP CONSTRAINT ident_sessions_assignment_id_fkey,
  ADD CONSTRAINT ident_sessions_assignment_id_fkey
    FOREIGN KEY (assignment_id) REFERENCES order_assignments(id) ON DELETE SET NULL;

ALTER TABLE ident_sessions
  DROP CONSTRAINT ident_sessions_order_id_fkey,
  ADD CONSTRAINT ident_sessions_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
