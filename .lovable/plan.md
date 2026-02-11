
# Bewerbungsgespraech-System: Status, Terminbuchung und Admin-Uebersicht

## Uebersicht

Dieses Feature erweitert das Bewerbungssystem um einen kompletten Workflow: Bewerbungen erhalten einen Status, koennen fuer ein Bewerbungsgespraech akzeptiert werden, und der Bewerber kann ueber einen oeffentlichen Link einen Termin buchen. Admins sehen alle gebuchten Termine in einer eigenen Uebersicht.

---

## 1. Datenbank-Aenderungen

### 1a. Neue Spalte `status` in `applications`

| Spalte | Typ | Default |
|---|---|---|
| status | text NOT NULL | 'neu' |

Moegliche Werte: `neu`, `bewerbungsgespraech`, `termin_gebucht`

### 1b. Neue Tabelle `interview_appointments`

| Spalte | Typ | Beschreibung |
|---|---|---|
| id | uuid (PK) | Automatisch generiert |
| application_id | uuid (FK, UNIQUE) | 1:1-Beziehung zu applications |
| appointment_date | date (NOT NULL) | Tag des Termins |
| appointment_time | time (NOT NULL) | Uhrzeit des Termins |
| created_at | timestamptz | Erstellungszeitpunkt |

- UNIQUE constraint auf `(appointment_date, appointment_time)` -- nur 1 Termin pro Zeitslot
- UNIQUE constraint auf `application_id` -- nur 1 Termin pro Bewerbung
- FK auf `applications.id` mit `ON DELETE CASCADE`

### 1c. RLS-Policies fuer `interview_appointments`

- **Admins**: Voller Zugriff (SELECT, INSERT, UPDATE, DELETE) via `has_role()`
- **Anon/Public SELECT**: Jeder darf lesen (um gebuchte Slots zu sehen)
- **Anon/Public INSERT**: Jeder darf einfuegen (Bewerber bucht Termin ueber oeffentlichen Link)

---

## 2. Aenderungen an `/admin/bewerbungen`

In der Tabelle werden zwei neue Spalten ergaenzt:

### Status-Spalte
- Zeigt den aktuellen Status als farbigen Badge:
  - **Neu** -- grauer/default Badge
  - **Bewerbungsgespraech** -- gelber Badge
  - **Termin gebucht** -- gruener Badge

### Aktions-Spalte (am Ende)
- Bei Status "Neu": Button "Akzeptieren" -- setzt Status auf `bewerbungsgespraech`
- Bei Status "Bewerbungsgespraech": Link-kopieren-Button, der den Link `/bewerbungsgespraech/{application_id}` in die Zwischenablage kopiert
- Bei Status "Termin gebucht": Anzeige des gebuchten Termins (Datum + Uhrzeit)
- Loeschen-Button bleibt bestehen

---

## 3. Oeffentliche Seite `/bewerbungsgespraech/:id`

Diese Seite ist **ohne Anmeldung** zugaenglich und wird vom Bewerber genutzt.

### Branding
- Laedt die Bewerbung inkl. zugehoeriges Branding (Logo, Brandingfarbe)
- Logo wird oben angezeigt, Brandingfarbe wird als Akzentfarbe verwendet (Buttons, Highlights)
- Professionelles, einladendes Design (kein Admin-Backend-Look)

### Ablauf
1. **Kalender**: Bewerber waehlt einen Tag (nur zukuenftige Tage, keine Wochenenden)
2. **Zeitslots**: Nach Tagesauswahl werden verfuegbare 30-Minuten-Slots von 08:00 bis 18:00 Uhr angezeigt (also 08:00, 08:30, 09:00, ..., 17:30)
3. Bereits gebuchte Slots sind ausgegraut und nicht klickbar
4. **Bestaetigung**: Nach Auswahl von Tag + Uhrzeit erscheint ein Bestaetigungs-Dialog
5. Bei Klick auf "Termin bestaetigen": INSERT in `interview_appointments`, Status der Bewerbung wird auf `termin_gebucht` gesetzt
6. **Confirmation Page**: Zeigt eine Bestaetigungsseite mit:
   - Haken-Icon und Erfolgsmeldung
   - Gebuchter Termin (Tag + Uhrzeit)
   - Hinweis "Bitte seien Sie zu diesem Zeitpunkt telefonisch erreichbar"
   - Alles im Branding des Unternehmens

### Schutz
- Wenn bereits ein Termin gebucht wurde (Link schon verwendet), wird direkt die Confirmation Page mit dem bestehenden Termin angezeigt
- Wenn die Application-ID ungueltig ist, wird eine Fehlerseite angezeigt

---

## 4. Admin-Seite `/admin/bewerbungsgespraeche`

### Sidebar
- Neuer Eintrag "Bewerbungsgespraeche" mit `Calendar`-Icon

### Inhalt
- Tabellarische Auflistung aller gebuchten Termine
- Spalten: Datum, Uhrzeit, Name des Bewerbers, E-Mail, Telefon, Branding
- Sortierung: Naechster Termin ganz oben (aufsteigend nach Datum + Uhrzeit)
- Pagination: Maximal 10 Eintraege pro Seite mit Vor/Zurueck-Navigation
- Laedt Daten via JOIN ueber `interview_appointments` -> `applications` -> `brandings`

---

## Technische Details

### Neue Dateien

| Datei | Zweck |
|---|---|
| `src/pages/Bewerbungsgespraech.tsx` | Oeffentliche Terminbuchungsseite |
| `src/pages/admin/AdminBewerbungsgespraeche.tsx` | Admin-Terminuebersicht mit Pagination |

### Geaenderte Dateien

| Datei | Aenderung |
|---|---|
| `src/App.tsx` | Neue Route `/bewerbungsgespraech/:id` (oeffentlich, ohne ProtectedRoute) und `/admin/bewerbungsgespraeche` |
| `src/pages/admin/AdminBewerbungen.tsx` | Status-Spalte, Aktions-Spalte mit Akzeptieren/Link-kopieren |
| `src/components/admin/AdminSidebar.tsx` | Neuer Nav-Eintrag "Bewerbungsgespraeche" |
| `src/integrations/supabase/types.ts` | Neue Tabelle und Spalten in den Typen |

### SQL-Migration

1. `ALTER TABLE applications ADD COLUMN status text NOT NULL DEFAULT 'neu'`
2. `CREATE TABLE interview_appointments` mit Constraints und RLS
3. RLS: Admins vollen Zugriff, Anon darf lesen und einfuegen

### Keine neuen Abhaengigkeiten

Verwendet vorhandene Libraries: Shadcn Calendar, date-fns, framer-motion, React Query, Zod, Lucide Icons.
