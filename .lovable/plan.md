
## Plan: `/erster-arbeitstag/:id` komplett login-unabhängig machen

### Was wirklich kaputt ist
Die Route ist im Router bereits öffentlich. Das Problem ist nicht `ProtectedRoute`, sondern der normale Supabase-Client in `src/integrations/supabase/client.ts`:

- `persistSession: true`
- `storage: localStorage`

Dadurch übernimmt die Seite auf dem Handy eine vorhandene Login-Session. Dann laufen die Requests als `authenticated` statt `anon`. Genau deshalb ist das Verhalten auf Handy und PC unterschiedlich.

Die letzte RLS-Änderung hat nur den `SELECT` auf `employment_contracts` erweitert. Sie entfernt aber nicht die Login-Abhängigkeit der Seite. Aktuell sind weiter auth-abhängig:
- Vertragsdaten laden
- vorhandenen ersten-Arbeitstag-Termin laden
- Mobilnummer ändern
- Termin umbuchen (`DELETE`)
- Termin buchen (`INSERT`)

### Umsetzung

#### 1. Öffentlichen, sessionlosen Supabase-Client anlegen
Neue Datei, z. B. `src/integrations/supabase/publicClient.ts`:

- gleiche Supabase-URL + Publishable Key
- keine Session-Übernahme
- kein `localStorage`
- `persistSession: false`
- `autoRefreshToken: false`
- isolierter/no-op storage

Ergebnis: Diese Seite nutzt immer den öffentlichen anon-Kontext, auch wenn im Browser irgendein User eingeloggt ist.

#### 2. `ErsterArbeitstag.tsx` komplett auf den Public-Client umstellen
Alle Lesezugriffe dieser Seite laufen künftig über den neuen Public-Client:

- `employment_contracts` + Branding laden
- bestehenden `first_workday_appointments` laden
- `branding_schedule_settings`
- geblockte Slots
- `booked_slots_for_branding`

Damit sieht die Seite auf Handy und PC immer dasselbe.

#### 3. Schreiben nicht mehr direkt über auth-abhängige Tabellenzugriffe
Ich ersetze die direkten Mutations durch öffentliche, link-basierte DB-Funktionen.

Neue SQL-Migration:

- `book_first_workday_public(_contract_id uuid, _appointment_date date, _appointment_time time, _phone text default null)`
  - `SECURITY DEFINER`
  - prüft, dass der Vertrag existiert
  - löscht vorhandenen Termin für den Vertrag
  - legt den neuen Termin an
  - aktualisiert optional die Telefonnummer

- `update_contract_phone_public(_contract_id uuid, _phone text)`
  - `SECURITY DEFINER`
  - aktualisiert nur die Telefonnummer für diesen Vertrag

- `GRANT EXECUTE` an `anon` und `authenticated`

Warum so:
- der Link funktioniert wirklich unabhängig vom Login
- Umbuchen klappt auch ohne Auth
- ich muss keine noch breiteren anon-DELETE/UPDATE-Policies öffnen

#### 4. Frontend-Mutations austauschen
In `src/pages/ErsterArbeitstag.tsx`:

- Telefon-Stift speichert per `rpc("update_contract_phone_public", ...)`
- Buchen/Umbuchen nutzt nur noch `rpc("book_first_workday_public", ...)`
- kein direktes `.delete()` / `.insert()` / `.update()` mehr für diese Seite

#### 5. Fehlerbild verbessern
Zusätzlich ändere ich das Fehlverhalten:

- klare Fehlermeldung/Toast bei Query- oder RPC-Fehlern
- `Ungültiger Link` nur dann, wenn die Vertrags-ID wirklich nicht existiert
- kein stilles Hängen an auth-abhängigen Requests mehr

### Betroffene Dateien
- Neu: `src/integrations/supabase/publicClient.ts`
- Edit: `src/pages/ErsterArbeitstag.tsx`
- Neu: SQL-Migration in `supabase/migrations/...`

### Wichtiger Punkt
Ich entferne keine React-Route-Protection, weil auf dieser Route schon keine existiert. Ich entferne die Login-Abhängigkeit der Supabase-Zugriffe. Das ist der eigentliche Bug.

### Ergebnis nach Umsetzung
Jeder, der den `/erster-arbeitstag/:contractId`-Link hat, kann die Seite nutzen – egal ob im selben Browser ein User eingeloggt ist oder nicht:

- Seite öffnen
- Daten sehen
- Mobilnummer bearbeiten
- Termin buchen
- Termin umbuchen

### QA nach Umsetzung
Ich prüfe gezielt:

1. Link ausgeloggt
2. Link eingeloggt mit richtigem User
3. Link eingeloggt mit falschem/anderem User
4. Mobile Viewport
5. Telefonnummer ändern
6. Erstbuchung + Umbuchung Ende-zu-Ende
