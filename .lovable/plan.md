

## Plan: Erinnerungs-Button bei Probetag + neue SMS/Email Vorlagen

### Uebersicht

Erinnerungs-SMS & E-Mail Button bei `/admin/probetag` (wie bei Bewerbungsgespraeche), mit rotem Zaehler-Badge, Timestamp-Popover, neuem SMS-Template und neuer Email-Vorschau.

### 1. DB-Migration

Neue Spalten auf `trial_day_appointments`:
- `reminder_count` (integer, default 0)
- `reminder_timestamps` (jsonb, default '[]')

Neues SMS-Template in `sms_templates`:
```sql
INSERT INTO sms_templates (event_type, label, message)
VALUES ('probetag_erinnerung', 'Probetag Erinnerung', 'Hallo {name}, Sie hatten einen Probetag-Termin bei uns. Falls Sie den Termin nicht wahrnehmen konnten, buchen Sie bitte einen neuen Termin über den Link in Ihrer E-Mail.');
```

### 2. AdminProbetag.tsx

- Imports hinzufuegen: `sendEmail`, `sendSms`, `buildBrandingUrl`, `MessageSquare`, `RefreshCw`, `Popover*`, `Dialog*`, `Textarea`, `format`
- State: `sendingReminder`, `reminderPreview`
- `handlePrepareReminder`: Laedt SMS-Template `probetag_erinnerung`, zeigt Vorschau-Dialog
- `handleConfirmReminder`: Sendet SMS + E-Mail (mit "Termin umbuchen" Button der auf `/probetag/{application_id}` linkt), inkrementiert `reminder_count` + `reminder_timestamps`
- In der Aktionen-Spalte: MessageSquare-Button mit rotem Badge + Popover (exakt wie bei Bewerbungsgespraeche)
- Vorschau-Dialog und Confirm-Dialog am Ende der Komponente

### 3. AdminSmsTemplates.tsx

Neuer Eintrag in `PLACEHOLDER_INFO`:
```
probetag_erinnerung: ["{name}"],
```

### 4. AdminEmails.tsx

Neues Template in der `templates`-Liste:
```typescript
{
  eventType: "probetag_erinnerung",
  label: "Probetag Erinnerung",
  subject: (c) => `Erinnerung an Ihren Probetag – ${c}`,
  bodyTitle: "Erinnerung an Ihren Probetag",
  bodyLines: (c) => [
    "Sehr geehrte/r Max Mustermann,",
    `Sie hatten einen Probetag-Termin bei ${c}. Leider konnten wir Sie nicht erreichen bzw. der Termin wurde nicht wahrgenommen.`,
    "Falls Sie den Termin nicht wahrnehmen konnten, haben Sie die Möglichkeit, einen neuen Termin zu buchen.",
  ],
  buttonText: "Neuen Probetag buchen",
  buttonUrl: "https://example.com/probetag/abc123",
}
```

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| DB-Migration | `reminder_count` + `reminder_timestamps` auf `trial_day_appointments`, neues SMS-Template |
| `AdminProbetag.tsx` | Erinnerungs-Button mit Badge, Popover, Vorschau-Dialog, SMS+Email senden |
| `AdminSmsTemplates.tsx` | `probetag_erinnerung` in PLACEHOLDER_INFO |
| `AdminEmails.tsx` | Neue Vorschau-Vorlage "Probetag Erinnerung" |

