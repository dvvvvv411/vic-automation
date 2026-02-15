

# Fix: CHECK-Constraint auf chat_messages blockiert Systemnachrichten

## Problem

Die Spalte `sender_role` in `chat_messages` hat einen CHECK-Constraint:

```sql
CHECK (sender_role = ANY (ARRAY['admin', 'user']))
```

Dieser Constraint blockiert das Einfuegen von Nachrichten mit `sender_role = 'system'` auf Datenbankebene -- noch bevor die RLS-Policy ueberhaupt greift. Die RLS-Policy ist korrekt, aber der Constraint verhindert den Insert.

## Loesung

Eine Migration, die den bestehenden CHECK-Constraint droppt und durch einen erweiterten ersetzt:

```sql
ALTER TABLE chat_messages DROP CONSTRAINT chat_messages_sender_role_check;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_sender_role_check
  CHECK (sender_role = ANY (ARRAY['admin', 'user', 'system']));
```

## Zusaetzlich: Fehlerbehandlung im Code

**Datei**: `src/pages/mitarbeiter/AuftragDetails.tsx`

Der Insert fuer die System-Nachricht (Zeile 169-173) prueft aktuell nicht auf Fehler. Falls der Insert fehlschlaegt, bemerkt der Nutzer das nicht. Ich fuege eine Fehlerbehandlung mit `console.error` hinzu, damit solche Probleme kuenftig sichtbar sind.

## Zusammenfassung

| Aenderung | Datei |
|---|---|
| CHECK-Constraint erweitern auf `'system'` | Migration (neu) |
| Fehlerbehandlung beim chat_messages Insert | `AuftragDetails.tsx` |

Nach dieser Aenderung wird die Systemnachricht bei der naechsten Terminbuchung korrekt im Chat erscheinen -- auch wenn der Chat nicht geoeffnet ist, da die Nachricht in der Datenbank gespeichert wird und beim naechsten Oeffnen geladen wird.

