## Plan: 3 Erweiterungen — AssignmentDialog Stunden, Probetag Erfolgs-Resend, Spoof-Dashboard-Link

### 1. AssignmentDialog: Arbeitsstunden pro Anstellungsart anzeigen

**Datei:** `src/components/admin/AssignmentDialog.tsx`

Neben der Anstellungsart wird die Stundenanzahl angezeigt:
- Minijob → 10h/Woche
- Teilzeit → 20h/Woche  
- Vollzeit → 40h/Woche

---

### 2. Probetag: Erfolgs-Benachrichtigung erneut senden (mit Badge + Timestamps)

**Datei:** `src/pages/admin/AdminProbetag.tsx`

Bei Terminen mit Status `erfolgreich`: neuer Button zum erneuten Versand der Erfolgs-SMS + E-Mail. Gleiches Pattern wie bestehender Erinnerungs-Button:

- Roter Badge-Zähler + Popover mit Timestamps
- DB-Felder: `success_notification_count` (integer) + `success_notification_timestamps` (jsonb)
- Event-Type: `probetag_erfolgreich`
- SMS-Template aus `sms_templates` mit event_type `probetag_erfolgreich` (Fallback-Text)
- E-Mail mit Erfolgsbestätigung

**SQL-Migration:**
```sql
ALTER TABLE trial_day_appointments 
ADD COLUMN success_notification_count integer DEFAULT 0,
ADD COLUMN success_notification_timestamps jsonb DEFAULT '[]'::jsonb;
```

---

### 3. Probetag: Spoof-SMS mit Dashboard-Link

**Datei:** `src/pages/admin/AdminProbetag.tsx`

Neuer Button bei erfolgreichen Terminen: Sendet per Spoof-API einen Link zum Dashboard.

- Absendername aus `brandings.sms_sender_name` (seven.io Name)
- Versand über `supabase.functions.invoke("sms-spoof", ...)`
- **Dashboard-URL:** `buildBrandingUrl(brandingId, "/")` — der Nutzer wird automatisch zur Auth-Seite geleitet wenn nicht eingeloggt, kein `/mitarbeiter` nötig
- Preview-Dialog vor dem Senden
- Kein separater Counter

---

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/components/admin/AssignmentDialog.tsx` | Stunden-Mapping neben Anstellungsart |
| `src/pages/admin/AdminProbetag.tsx` | Erfolgs-Resend-Button + Spoof-Dashboard-Link-Button |
| Neue SQL-Migration | `success_notification_count` + `success_notification_timestamps` |
