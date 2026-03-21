

## 1. Arbeitstag - Buchungssystem & Probetag-Erfolgreich-Email

### Uebersicht

Neues Buchungssystem fuer den "1. Arbeitstag", analog zu Bewerbungsgespraechen und Probetagen. Plus automatische Email bei erfolgreichem Probetag.

---

### Aenderungen im Detail

**1. DB-Migration: Neue Tabelle `first_workday_appointments`**
- Struktur identisch zu `trial_day_appointments`: id, application_id, appointment_date, appointment_time, status (default 'neu'), created_by, created_at, reminder_sent (default false)
- RLS-Policies analog zu `trial_day_appointments` (admin, kunde, anon read/insert)
- Neue Tabelle `first_workday_blocked_slots` (analog zu `trial_day_blocked_slots`): id, blocked_date, blocked_time, branding_id, reason, created_by, created_at
- RLS analog zu `schedule_blocked_slots`
- Neue DB-Funktion `update_first_workday_status` (analog zu `update_trial_day_status`)

**2. `branding_schedule_settings`** bekommt einen neuen `schedule_type`-Wert: `'first_workday'` — keine Schema-Aenderung noetig, da `schedule_type` ein Text-Feld ist.

**3. Oeffentliche Buchungsseite: `src/pages/ErsterArbeitstag.tsx`**
- Kopie von `Probetag.tsx`, angepasst auf "1. Arbeitstag"
- Route: `/erster-arbeitstag/:id` (application_id)
- Laedt `first_workday_appointments` statt `trial_day_appointments`
- Schedule-Settings mit `schedule_type: 'first_workday'`
- Blocked Slots aus `first_workday_blocked_slots`
- Titel: "1. Arbeitstag buchen"
- Bestaetigung: "1. Arbeitstag bestaetigt"
- Sendet Telegram (`erster_arbeitstag_gebucht`), Email (`erster_arbeitstag_bestaetigung`), SMS (`erster_arbeitstag_bestaetigung`)

**4. Route in `App.tsx`**
- `/erster-arbeitstag/:id` -> `ErsterArbeitstag`

**5. Admin-Seite: `src/pages/admin/AdminErsterArbeitstag.tsx`**
- Kopie von `AdminProbetag.tsx`, angepasst auf "1. Arbeitstag"
- Laedt aus `first_workday_appointments`
- Status-Updates via `update_first_workday_status` RPC
- Keine automatische Email bei Statusaenderung (nur Anzeige)

**6. Route + Sidebar**
- Route `/admin/erster-arbeitstag` in `App.tsx`
- Neuer Sidebar-Eintrag "1. Arbeitstag" unter "Recruiting" nach "Probetage"

**7. AdminProbetag.tsx: Link-Button + Email bei Erfolgreich**

Bei Status "erfolgreich":
- Email senden: "Probetag erfolgreich" — body_lines mit Text dass Ergebnisse geprueft wurden und naechster Schritt Daten vervollstaendigen / Arbeitsvertrag ausfuellen
- `event_type: "probetag_erfolgreich"`
- Kein Button in der Email (kein Link fuer 1. Arbeitstag automatisch)

Neuer Button in der Aktionen-Spalte wenn status === "erfolgreich":
- Copy-Icon Button, der den Buchungslink `/erster-arbeitstag/{application_id}` ueber `buildBrandingUrl` generiert und in die Zwischenablage kopiert
- Toast: "Link kopiert!"

**8. AdminZeitplan.tsx: Neuer Tab "1. Arbeitstag"**
- Dritter Tab neben "Bewerbungsgespraeche" und "Probetage"
- Verwendet dieselbe `TrialDayBlocker`-Komponente (oder eine analoge), mit `schedule_type: 'first_workday'` und `first_workday_blocked_slots`
- Da `TrialDayBlocker` auf `trial_day_blocked_slots` hardcoded ist, wird eine neue Komponente `FirstWorkdayBlocker` erstellt (oder `TrialDayBlocker` generalisiert mit Props fuer Tabellenname und schedule_type)

**9. AdminEmails.tsx: Neues Template "Probetag erfolgreich"**
- Eintrag mit `eventType: "probetag_erfolgreich"`, Vorschau-Text

**10. AdminEmails.tsx: Neues Template "1. Arbeitstag Bestaetigung"**
- Eintrag mit `eventType: "erster_arbeitstag_bestaetigung"`

**11. send-appointment-reminders Edge Function**
- Erweitern um `first_workday_appointments`-Block analog zu Trial Days
- SMS-Template `erster_arbeitstag_erinnerung_auto`

**12. Telegram**
- Event `erster_arbeitstag_gebucht` wird bereits ueber die bestehende `sendTelegram`-Funktion unterstuetzt (kein Code-Aenderung noetig, nur Aufruf in der Buchungsseite)

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| Migration | Neue Tabelle + RLS + RPC |
| `src/pages/ErsterArbeitstag.tsx` | Neue oeffentliche Buchungsseite |
| `src/pages/admin/AdminErsterArbeitstag.tsx` | Neue Admin-Terminuebersicht |
| `src/pages/admin/AdminProbetag.tsx` | Email bei erfolgreich + Link-Copy-Button |
| `src/pages/admin/AdminZeitplan.tsx` | Neuer Tab "1. Arbeitstag" |
| `src/pages/admin/AdminEmails.tsx` | 2 neue Templates |
| `src/components/admin/AdminSidebar.tsx` | Neuer Menuepunkt |
| `src/App.tsx` | 2 neue Routes |
| `supabase/functions/send-appointment-reminders/index.ts` | 1. Arbeitstag Erinnerungen |
| `src/integrations/supabase/types.ts` | Wird automatisch aktualisiert |

### Keine zusaetzlichen Secrets/APIs noetig
Alles nutzt bestehende Infrastruktur (send-email, send-sms, send-telegram).

