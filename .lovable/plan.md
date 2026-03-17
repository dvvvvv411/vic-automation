

## Plan: SMS-Benachrichtigung bei Ident-Daten-Einreichung

### Was passiert

Wenn ein Admin/Kunde in `/admin/idents/:id` die Testdaten speichert und der Status auf `data_sent` wechselt, erhaelt der Mitarbeiter eine SMS, dass die Daten eingereicht wurden und er den Auftrag bearbeiten kann.

### Aenderungen

**1. DB-Migration: Neues SMS-Template einfuegen**

```sql
INSERT INTO sms_templates (event_type, label, message)
VALUES (
  'ident_daten_gesendet',
  'Ident-Daten gesendet',
  'Hallo {name}, die Testdaten für deinen Auftrag "{auftrag}" wurden eingereicht. Du kannst den Auftrag jetzt bearbeiten.'
);
```

**2. `src/pages/admin/AdminIdentDetail.tsx` — SMS nach erfolgreichem Speichern senden**

In der `handleSave`-Funktion (Zeile 245-265): Nach erfolgreichem Update und wenn `filteredData.length > 0` (also Status wird `data_sent`), das SMS-Template laden, Platzhalter ersetzen und per `sendSms()` an die Telefonnummer des Mitarbeiters senden.

Benoetigte Daten sind bereits vorhanden:
- `contract` (Name) und `order` (Titel) werden schon per Query geladen
- Telefonnummer: zusaetzlicher Query auf `employment_contracts.phone` (bereits in `contractDetails` vorhanden)
- `session.branding_id` fuer Branding-Zuordnung

**3. `src/pages/admin/AdminSmsTemplates.tsx` — Platzhalter-Info ergaenzen**

In `PLACEHOLDER_INFO` den neuen Event-Type hinzufuegen:
```typescript
ident_daten_gesendet: ["{name}", "{auftrag}"],
```

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| DB-Migration | Neues `sms_templates`-Row fuer `ident_daten_gesendet` |
| `src/pages/admin/AdminIdentDetail.tsx` | SMS-Versand in `handleSave` nach Status-Wechsel auf `data_sent` |
| `src/pages/admin/AdminSmsTemplates.tsx` | Platzhalter-Info fuer neuen Event-Type |

