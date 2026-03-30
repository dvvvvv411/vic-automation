
## Klartext

Ja — **sehr wahrscheinlich hängt es genau mit der späteren Workflow-Umstellung zusammen**.

Ich habe Kevins Daten geprüft und der Fall ist eindeutig:

```text
Aktiver Vertrag:
contract_id = 25ccd550-627d-480c-967b-734aad8daad2
contract.application_id = 5de180fc-87e-4b14-b2f0-dff56ed6d1f6

Vorhandener Termin:
appointment_id = acd0c831-6400-4bfa-882d-fbc1bac2a22e
appointment_date = 2026-04-01
appointment_time = 09:30
first_workday_appointments.contract_id = NULL
first_workday_appointments.application_id = acf1ab73-8bc1-4eb6-8c9d-852e5b7c178e
```

Und die Bestätigungsmail wurde **1 Sekunde später** gesendet. Das heißt:
- Kevin hat **wirklich gebucht**
- der Termin ist **nicht weg**
- er ist nur **falsch / legacy verknüpft**
- deshalb taucht er in `/admin/erster-arbeitstag` nicht auf

## Warum er im Admin nicht erscheint

`/admin/erster-arbeitstag` lädt aktuell mit:

```text
first_workday_appointments
  -> employment_contracts:contract_id!inner(...)
```

Also nur Termine, die eine **gültige contract_id** haben.

Kevins Termin ist aber noch im **alten application-basierten Format** gespeichert:
- `contract_id = NULL`
- `application_id = alte/falsche Application-ID`

Darum ist er im Admin unsichtbar.

## Was das wahrscheinlich verursacht hat

Sehr wahrscheinlich wurde der 1.-Arbeitstag-Flow **nachträglich von application-basiert auf contract-basiert umgebaut**. Kevins Buchung stammt offenbar noch aus dem alten/halben Übergangszustand.

Das erklärt perfekt:
- Mail ging raus
- Termin existiert in der DB
- Admin sieht ihn nicht
- heutiger Code sucht an anderer Stelle

## Was ich umsetzen würde

### 1. Kevin **nicht neu einfügen**, sondern korrekt reparieren
Ich würde **keinen neuen Termin anlegen**, weil sonst ein Duplikat entstehen kann.

Stattdessen die vorhandene Zeile korrigieren:

```sql
UPDATE public.first_workday_appointments
SET
  contract_id = '25ccd550-627d-480c-967b-734aad8daad2',
  application_id = '5de180fc-87e6-4b14-b2f0-dff56ed6d1f6'
WHERE id = 'acd0c831-6400-4bfa-882d-fbc1bac2a22e';
```

Damit wäre Kevins Termin sofort in `/admin/erster-arbeitstag` sichtbar.

### 2. Admin-Seite robust machen
`src/pages/admin/AdminErsterArbeitstag.tsx` muss nicht nur `contract_id!inner(...)` lesen, sondern auch **Legacy-Termine** abfangen.

Geplanter Umbau:
- Termine zuerst aus `first_workday_appointments` laden
- Verträge danach per
  - `contract_id`
  - oder Fallback über `application_id`
  auflösen
- dann dieselbe Datenauflösung wie bisher verwenden

Dann sieht der Admin:
- neue contract-basierte Termine
- alte application-basierte Termine
- gemischte Übergangsfälle

### 3. Datenbestand bereinigen
Zusätzliche SQL-Migration / Datenreparatur für alte Datensätze:

- alle `first_workday_appointments` mit `contract_id IS NULL`
- passenden Vertrag über `application_id` suchen
- `contract_id` nachziehen
- falls mehrere Verträge existieren:
  - bevorzugt `genehmigt`
  - sonst neuesten Vertrag

Damit verschwinden solche Fälle nicht nur bei Kevin, sondern systemweit.

### 4. Buchungsflow hart absichern
`book_first_workday_public(...)` sollte künftig:
- die erzeugte Appointment-ID zurückgeben
- nach dem Insert eindeutig den finalen Datensatz liefern
- immer mit korrekter `contract_id` arbeiten

Frontend in `src/pages/ErsterArbeitstag.tsx`:
- nach RPC nicht blind Erfolg anzeigen
- erst Datensatz verifizieren
- **danach** Mail/SMS/Telegram senden

So vermeiden wir Inkonsistenzen.

## Betroffene Dateien

- `src/pages/admin/AdminErsterArbeitstag.tsx`
- SQL-Migration in `supabase/migrations/...`
- optional `src/pages/ErsterArbeitstag.tsx` zur zusätzlichen Verifikation

## Wichtigster Punkt

Der Termin von Kevin fehlt **nicht**.
Er ist **vorhanden, aber an der falschen Stelle verknüpft**.

Also:
- Ja, die spätere Workflow-Änderung ist sehr wahrscheinlich der Grund.
- Nein, man sollte **nicht blind neu einfügen**.
- Richtig ist: **bestehenden Termin auf den richtigen Vertrag umhängen** und den Admin-Screen legacy-sicher machen.
