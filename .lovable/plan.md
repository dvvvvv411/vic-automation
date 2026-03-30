
Ziel: `/admin/erster-arbeitstag` sofort wieder stabil anzeigen und fehlende Felder (Name, Telefon, E-Mail, Anstellungsart) korrekt aus vorhandenen Datenquellen auflösen – ohne Ausblenden.

### Diagnose (warum jetzt gar nichts mehr kommt)
- Der aktuelle Query in `AdminErsterArbeitstag.tsx` nutzt:
  - `profiles:user_id(...)` innerhalb des eingebetteten `employment_contracts` Selects.
- Laut Network-Fehler liefert PostgREST dafür `400 PGRST200`:
  - „Could not find a relationship between employment_contracts and user_id in schema cache“
- Ergebnis: Query bricht komplett, daher erscheinen 0 Termine.

### Umsetzung (konkret)
1. **Defekten Embedded-Join entfernen**
   - In `src/pages/admin/AdminErsterArbeitstag.tsx` die `profiles:user_id(...)`-Einbettung aus dem Haupt-Select entfernen.
   - Hauptquery bleibt auf `first_workday_appointments + employment_contracts + brandings` fokussiert und funktioniert wieder.

2. **Daten korrekt per Folgequeries holen (ohne FK-Abhängigkeit)**
   - Nach dem paginierten Hauptquery:
     - `user_id`s der geladenen Contracts sammeln
     - `application_id`s der Termine (und optional `employment_contracts.application_id`) sammeln
   - Danach parallel:
     - `profiles` per `.in("id", userIds)` laden (`id, full_name, email, phone`)
     - `applications` per `.in("id", applicationIds)` laden (`first_name, last_name, email, phone, employment_type`)
   - Diese Daten in Maps zusammenführen und pro Termin ein `resolved`-Objekt bauen.

3. **Fallback-Logik im Rendering vereinheitlichen**
   - Name: `contract.first/last` → `profile.full_name` → `application.first/last`
   - Telefon/E-Mail: `contract` → `profile` → `application`
   - Anstellungsart: `contract.employment_type` → `application.employment_type` → `–`
   - Dieselbe Logik für:
     - Tabellenanzeige
     - Suche
     - Delete-Dialog-Name
     - „Fehlgeschlagen“-Dialogtext
     - Notizinhalt bei Fehlgeschlagen

4. **Fehlerzustand sichtbar machen (kein stilles „Keine Termine“)**
   - `isError`/`error` aus `useQuery` behandeln und klare Fehlermeldung rendern (statt leerer Liste), damit ein API-Fehler sofort erkennbar ist.

### Warum das deine Anforderung trifft
- Kein „Ausblenden“-Workaround.
- Es werden weiterhin alle gebuchten 1.-Arbeitstag-Termine gezeigt.
- Daten kommen robust aus den real existierenden Mitarbeiter-/Bewerberdaten, auch wenn einzelne Felder im Contract leer sind.
- Der aktuelle Totalausfall wird direkt behoben.

### Betroffene Datei
- `src/pages/admin/AdminErsterArbeitstag.tsx`

### Technische Details (kurz)
- Kein DB-Schema-Change nötig.
- Kein RLS-Change nötig.
- Ursache ist ein ungültiger relationaler Embed (fehlende FK-Relation für PostgREST), nicht dein Buchungsworkflow.
