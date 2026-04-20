

## Plan: Status zurücksetzen + Reihenfolge fixen

### Teil 1 — Status-Reset für heutige META-Bewerber ohne SMS

Einmaliges SQL-Update (im Default-Mode):

```sql
UPDATE applications
SET status = 'neu'
WHERE is_meta = true
  AND created_at::date = '2026-04-20'
  AND status = 'bewerbungsgespraech'
  AND id NOT IN (
    SELECT DISTINCT a.id FROM applications a
    JOIN sms_logs s ON s.recipient_phone IS NOT NULL
    WHERE s.event_type = 'bewerbung_angenommen_extern_meta'
      AND s.created_at::date = '2026-04-20'
      AND (s.recipient_name ILIKE a.first_name || ' ' || a.last_name)
  );
```

Vor Ausführung: Liste der betroffenen Bewerber zeigen, du bestätigst, dann Update. Zugehörige `interview_appointments` (falls automatisch erstellt) werden ebenfalls gelöscht, damit "Akzeptieren" sauber neu funktioniert.

### Teil 2 — Reihenfolge in `acceptMutation` umkehren

**Datei `src/lib/sendSms.ts`:**
- `return false` bei Fehler → `throw new Error("SMS-Versand fehlgeschlagen: ...")`

**Datei `src/lib/sendEmail.ts`:**
- Silent `console.error` bei Fehler → `throw new Error("E-Mail-Versand fehlgeschlagen: ...")`

**Datei `src/pages/admin/AdminBewerbungen.tsx` → `acceptMutation`:**

Neue Reihenfolge:
1. Branding/Template/Short-Link vorbereiten
2. `await sendEmail(...)` — wirft bei Fehler
3. `await sendSms(...)` — wirft bei Fehler
4. **Erst jetzt**: `supabase.from("applications").update({ status: "bewerbungsgespraech" })`
5. Erfolgs-Toast nur nach Schritt 4

Bei Fehler in Schritt 2 oder 3: Status bleibt `neu`, Fehler-Toast mit konkreter Meldung, Bewerber kann erneut akzeptiert werden.

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| (SQL einmalig) | Status-Reset heutiger META-Bewerber ohne SMS |
| `src/lib/sendSms.ts` | `throw` statt `return false` |
| `src/lib/sendEmail.ts` | `throw` statt silent `console.error` |
| `src/pages/admin/AdminBewerbungen.tsx` | `acceptMutation`: Notifications zuerst, Status zuletzt; konkrete Fehler-Toasts |

### Was NICHT geändert wird

- Keine DB-Migration für neue Tabellen/Trigger
- Keine Edge-Function-Änderung
- Keine UI-Umstrukturierung

### Ablauf nach Freigabe

1. Liste der betroffenen Bewerber von heute anzeigen → du bestätigst
2. Status-Reset ausführen
3. Code-Fix in den 3 Dateien deployen
4. Du kannst die zurückgesetzten Bewerber erneut akzeptieren — diesmal mit garantiertem Versand oder klarer Fehlermeldung

