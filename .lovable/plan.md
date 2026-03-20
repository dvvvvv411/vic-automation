
## Befund

- Der Probetag-Termin ist **korrekt gespeichert**:
  - Termin: **21.03.2026, 11:00**
  - Bewerbung: **Tobias Papst**
  - Branding: **Efficient Flow Solutions GmbH**
- Auch Mail- und SMS-Logs hängen am **Efficient-Flow-Branding**.  
  Das heißt: **Die Buchungsseite speichert nicht falsch**, sondern der Datensatz ist da und dem richtigen Branding zugeordnet.

## Echte Ursache

Die Admin-Seite `/admin/probetag` sendet den richtigen Filter an Supabase. Im Browser ist sogar ein Request mit der Efficient-Flow-Branding-ID zu sehen, aber die Response ist trotzdem:

```text
[]
```

Der Grund ist **RLS auf `trial_day_appointments`**:

- Für `trial_day_appointments` gibt es aktuell **keine SELECT-Policy für admin/kunde**
- Es gibt dort nur:
  - `anon` SELECT
  - `caller` SELECT
- Folge: Ein eingeloggter Admin/Kunde bekommt **stille leere Ergebnisse** statt eines Fehlers

Darum siehst du auf `/admin/probetag` nichts, obwohl der Termin existiert.

## Was ich umsetzen würde

### 1. RLS für `trial_day_appointments` reparieren
Die Policies für `trial_day_appointments` an die funktionierende Logik von `interview_appointments` angleichen.

Konkret:
- fehlende **SELECT-Policy für admin/kunde** ergänzen
- prüfen, ob DELETE/UPDATE/INSERT ebenfalls sauber konsistent sind

Beispielrichtung:

```sql
create policy "Admins can select trial_day_appointments"
on public.trial_day_appointments
for select
to authenticated
using (
  has_role(auth.uid(), 'admin')
  or (
    is_kunde(auth.uid())
    and (
      not user_has_any_branding(auth.uid())
      or application_id in (select apps_for_branding_ids(auth.uid()))
    )
  )
  or (
    is_caller(auth.uid())
    and application_id in (select apps_for_branding_ids(auth.uid()))
  )
);
```

### 2. Keine Änderung an der Branding-Zuordnung der Buchung
Am Insert selbst muss ich für dieses Problem **nichts an der Branding-Speicherung umbauen**.  
Die Zuordnung läuft bereits korrekt über `applications.branding_id`.

### 3. Telegram-Fix direkt mit erledigen
Es gibt zusätzlich noch den bereits gefundenen Bug:
`src/pages/Probetag.tsx` ruft `sendTelegram(...)` **ohne `branding_id`** auf.

Dadurch kommen branding-gefilterte Telegram-Chats nicht an.  
Das würde ich im selben Durchgang mitfixen:

```ts
await sendTelegram("probetag_gebucht", message, application.branding_id);
```

## Betroffene Stellen

| Bereich | Änderung |
|---|---|
| `supabase/migrations/...` | fehlende RLS-Policy für `trial_day_appointments` ergänzen |
| `src/pages/Probetag.tsx` | `branding_id` an Telegram-Aufruf übergeben |

## Erwartetes Ergebnis

Nach der Umsetzung:

- der vorhandene Efficient-Flow-Probetag erscheint auf `/admin/probetag`
- neue Probetag-Termine sind für Admin/Kunde korrekt sichtbar
- Telegram-Nachrichten können wieder brandingbasiert zugestellt werden

## Technische Kurzfassung

Das Problem ist **nicht**:
- falsches Branding beim Buchen
- falscher Admin-Filter
- fehlender Datensatz

Das Problem ist:
- **falsche/fehlende RLS-SELECT-Policy auf `trial_day_appointments`**
- plus separat: **fehlende `branding_id` beim Telegram-Versand**
