

# Email TAN Feature für Ident-Sessions

## Übersicht
Admin kann "Email TAN" per Switch aktivieren. Beim Mitarbeiter wird die SMS-Card in der Höhe halbiert und darunter erscheint eine Email-TAN-Card (im roten Bereich des Screenshots). Admin gibt TANs manuell ein, die sofort per Supabase Realtime beim Mitarbeiter erscheinen.

## Änderungen

### 1. DB-Migration
Zwei neue Spalten auf `ident_sessions`:
```sql
ALTER TABLE ident_sessions ADD COLUMN email_tan_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE ident_sessions ADD COLUMN email_tans jsonb NOT NULL DEFAULT '[]'::jsonb;
```
`email_tans` = Array von `{ code: string, created_at: string }`.

### 2. Admin-Seite (`AdminIdentDetail.tsx`)
- **Switch** "Email TAN" unter der Phone-Card im linken Bereich, speichert `email_tan_enabled` sofort in DB
- Wenn aktiviert: neue Card mit Input + "TAN senden" Button, der Code an `email_tans` JSON-Array anhängt
- Bisherige TANs chronologisch angezeigt (neueste oben)

### 3. Mitarbeiter-Seite (`AuftragDetails.tsx`)
- `IdentSession` Interface um `email_tan_enabled` und `email_tans` erweitern
- Im `videident`-Step, linke Spalte: SMS-Card bekommt `max-h-48` statt volle Höhe, darunter eine neue "Email Nachrichten" Card mit gleicher Höhe
- Beide Cards stacken vertikal in der linken Spalte (SMS oben, Email unten)
- Email-TAN-Card zeigt TANs in gleicher Optik wie SMS-Nachrichten
- Bestehender Realtime-Listener liefert `email_tan_enabled` und `email_tans` automatisch mit — kein zusätzlicher Channel nötig

### Layout-Änderung (linke Spalte im videident-Step)
```text
┌─────────────────┐  ┌─────────────────┐
│ SMS Nachrichten  │  │                 │
│ (halbe Höhe)     │  │   Test-Daten    │
├─────────────────┤  │                 │
│ Email Nachr.     │  │                 │
│ (halbe Höhe)     │  │                 │
└─────────────────┘  └─────────────────┘
```

| Datei | Änderung |
|-------|----------|
| Migration | `email_tan_enabled`, `email_tans` auf `ident_sessions` |
| `AdminIdentDetail.tsx` | Switch + TAN-Eingabe + TAN-Liste |
| `AuftragDetails.tsx` | Interface erweitern, SMS-Card halbieren, Email-Card darunter |

