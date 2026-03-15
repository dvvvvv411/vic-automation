

# Probetag-Buchungssystem einbauen

## Übersicht
Neuer Workflow-Schritt zwischen "Bewerbungsgespräch erfolgreich" und "Arbeitsvertrag ausfüllen": Der Bewerber bucht einen Probetag-Termin über eine öffentliche Seite (`/probetag/:id`). Admins verwalten die Termine unter `/admin/probetag` und können Probetag-Slots unter `/admin/zeitplan` blockieren.

## Datenbank-Änderungen

### Neue Tabelle: `trial_day_appointments`
Identische Struktur wie `interview_appointments`, aber unabhängige Buchungen:
- `id` (uuid, PK)
- `application_id` (uuid, NOT NULL)
- `appointment_date` (date)
- `appointment_time` (time)
- `status` (text, default 'neu')
- `created_by` (uuid, nullable)
- `created_at` (timestamptz)

RLS-Policies analog zu `interview_appointments` (Admin full access, Anon can book + read).

### Neue Tabelle: `trial_day_blocked_slots`
Identische Struktur wie `schedule_blocked_slots`, unabhängige Sperren:
- `id`, `blocked_date`, `blocked_time`, `reason`, `branding_id`, `created_by`, `created_at`

RLS analog zu `schedule_blocked_slots`.

### Neue DB-Funktion: `update_trial_day_status`
Analog zu `update_interview_status`, aber für `trial_day_appointments`.

## Neue Dateien

### 1. `src/pages/Probetag.tsx` — Öffentliche Buchungsseite
Kopie von `Bewerbungsgespraech.tsx` mit folgenden Änderungen:
- Queries lesen aus `trial_day_appointments` statt `interview_appointments`
- Blocked Slots aus `trial_day_blocked_slots` statt `schedule_blocked_slots`
- Texte: "Probetag" statt "Bewerbungsgespräch", "Probetag buchen" statt "Termin buchen"
- Buchung insertet in `trial_day_appointments`
- Telegram-Nachricht: "Probetag gebucht" statt "Bewerbungsgespräch gebucht"
- Nutzt dieselben `branding_schedule_settings` für Zeitfenster-Generierung

### 2. `src/pages/admin/AdminProbetag.tsx` — Admin-Terminübersicht
Kopie von `AdminBewerbungsgespraeche.tsx` mit:
- Queries aus `trial_day_appointments` mit Join auf `applications`
- Titel: "Probetag-Termine"
- Status-Handling: "Erfolgreich" markieren sendet E-Mail mit Arbeitsvertrag-Link (bisheriger Schritt verschiebt sich hierher)
- "Fehlgeschlagen" markieren analog

## Bestehende Dateien ändern

### 3. `src/pages/admin/AdminBewerbungsgespraeche.tsx` — Workflow anpassen
- Bei "erfolgreich" markieren: Statt Arbeitsvertrag-Link → Probetag-Buchungslink senden
- E-Mail-Text: "Buchen Sie nun einen Termin für Ihren Probetag"
- Button: "Probetag buchen" mit Link zu `/probetag/{application_id}`

### 4. `src/pages/admin/AdminZeitplan.tsx` — Probetag-Blocker
- Neue Sektion (analog zu `OrderAppointmentBlocker`) für Probetag-Slots
- Neuer Import einer `TrialDayBlocker`-Komponente die `trial_day_blocked_slots` verwendet

### 5. `src/components/admin/TrialDayBlocker.tsx` — Blocker-Komponente
Kopie von `OrderAppointmentBlocker.tsx`, aber operiert auf `trial_day_blocked_slots` Tabelle.

### 6. `src/App.tsx` — Routing
- Route `/probetag/:id` → `Probetag`
- Route `/admin/probetag` → `AdminProbetag`

### 7. `src/components/admin/AdminSidebar.tsx` — Navigation
- Neuer Eintrag "Probetage" unter "Recruiting" (nach Bewerbungsgespräche, vor Arbeitsverträge)
- Badge-Count für heute anstehende Probetage

## Workflow-Zusammenfassung

```text
Bewerbung → Gespräch buchen → Gespräch erfolgreich
  → E-Mail: "Probetag buchen" (Link /probetag/:id)
  → Probetag buchen → Probetag erfolgreich
    → E-Mail: "Arbeitsvertrag ausfüllen" (Link /arbeitsvertrag/:id)
```

