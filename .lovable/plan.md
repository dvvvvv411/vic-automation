

## Plan: Simon & Andrea DKB-Auftrag auf Anhänge-Schritt setzen + Ident-Sessions als abgeschlossen eintragen

### Aktuelle Lage

| Mitarbeiter | Assignment | Reviews | Status |
|---|---|---|---|
| Simon Alebachew | `8e0f3e2a` | 0 (gelöscht durch Bug) | offen |
| Andrea Sebastian Vendramin | `24098b3d` | 7 vorhanden | offen |

Beide haben keine Ident-Sessions mehr (durch CASCADE gelöscht).

### Was gemacht wird (alles via Supabase Insert-Tool, keine Code-Änderungen)

**1. Beide Assignments auf `in_pruefung` setzen**

```sql
UPDATE order_assignments 
SET status = 'in_pruefung'
WHERE id IN ('8e0f3e2a-f5e0-4f09-8190-0d9338712b7a', '24098b3d-7add-4fe7-8cec-6de524fb9c43');
```

**2. Für Simon 7 Reviews einfügen** (gleiche Fragen wie der Auftrag, neutrale 4/5 Bewertung)

Die 7 Fragen werden aus `orders.review_questions` des DKB-Auftrags (`f1c42b20-1207-46cb-9eed-c97edefaaddd`) übernommen.

**3. Für beide eine abgeschlossene Ident-Session einfügen**

```sql
INSERT INTO ident_sessions (contract_id, assignment_id, order_id, branding_id, status, completed_at)
VALUES
-- Simon
('de992ca7-...', '8e0f3e2a-...', 'f1c42b20-...', '<branding_id>', 'completed', now()),
-- Andrea
('f477225a-...', '24098b3d-...', 'f1c42b20-...', '<branding_id>', 'completed', now());
```

Diese tauchen dann in `/admin/idents` unter "Abgeschlossen" auf, weil `AdminIdents.tsx` nach `branding_id` filtert und Sessions mit Status `completed` in der "Abgeschlossen"-Sektion anzeigt.

### Ergebnis

- Beide sehen in ihrer App den Auftrag im Status "Anhänge hochladen"
- Beide erscheinen in `/admin/idents` als abgeschlossene Ident-Sessions
- Simon hat seine 7 Reviews wiederhergestellt

### Betroffene Dateien

Keine Code-Änderungen — nur Datenbank-Updates über das Insert-Tool.

