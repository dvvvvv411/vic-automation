
## Plan: 3 Erweiterungen — AssignmentDialog Stunden, Probetag Erfolgs-Resend, Spoof-Dashboard-Link

### 1. AssignmentDialog: Arbeitsstunden anzeigen

**Datei:** `src/components/admin/AssignmentDialog.tsx` (Zeile 274-281)

In der Sublabel-Zeile wird nach `employmentType` die Stundenzahl ergänzt:
- `Minijob · 10h/Woche`
- `Teilzeit · 20h/Woche`
- `Vollzeit · 40h/Woche`

---

### 2. Probetag: Erfolgs-SMS/E-Mail erneut senden

**Datei:** `src/pages/admin/AdminProbetag.tsx`

Neuer Button (CheckCircle oder ähnliches Icon, grüne Farbe) bei Terminen mit Status `erfolgreich`:
- Klick → Lade SMS-Template `probetag_erfolgreich` + Preview-Dialog (gleicher Stil wie Erinnerungs-Preview)
- Bestätigen → SMS via `sendSms` + E-Mail via `sendEmail` senden
- Counter `success_notification_count` + Timestamps `success_notification_timestamps` in DB updaten
- Roter Badge + Popover mit Zeitstempeln (1:1 wie beim Erinnerungs-Button)

### 3. Probetag: Spoof-SMS mit Dashboard-Link

**Datei:** `src/pages/admin/AdminProbetag.tsx`

Neuer Button (Link-Icon) bei erfolgreichen Terminen:
- Klick → Preview-Dialog mit Text wie `"Logge dich jetzt in dein Dashboard ein: {url}"`
- URL via `buildBrandingUrl(brandingId, "/")` — kein `/mitarbeiter` nötig
- Absendername aus `brandings.sms_sender_name`
- Versand über `supabase.functions.invoke("sms-spoof", { body: { action: "send", to, senderID, text, brandingId } })`
- Kein separater Counter

### 4. SQL-Migration

```sql
ALTER TABLE trial_day_appointments 
ADD COLUMN IF NOT EXISTS success_notification_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS success_notification_timestamps jsonb DEFAULT '[]'::jsonb;
```

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/components/admin/AssignmentDialog.tsx` | Stunden-Mapping neben Anstellungsart (Zeile 279) |
| `src/pages/admin/AdminProbetag.tsx` | 2 neue Buttons + 2 Preview-Dialoge + Handler |
| Neue SQL-Migration | `success_notification_count` + `success_notification_timestamps` |
