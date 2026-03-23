

## Plan: 3 Aenderungen

### 1. Gebuchter Termin anzeigen + Umbuchen ermoeglichen

In allen 3 Buchungsseiten (`Bewerbungsgespraech.tsx`, `Probetag.tsx`, `ErsterArbeitstag.tsx`):

Aktuell: Wenn `existingAppointment` vorhanden, wird NUR die Bestaetigungsseite angezeigt — kein Zugang zum Kalender.

Neu: Statt der reinen Bestaetigungsseite wird der gebuchte Termin als Card oben angezeigt, darunter ein "Termin umbuchen" Button. Wenn geklickt, erscheint der Kalender darunter. Bei Umbuchung wird der alte Termin geloescht und ein neuer erstellt.

Konkret in jeder Datei:
- Neuen State `isRebooking` hinzufuegen
- Die `existingAppointment`-Ansicht aendern: Card mit Termindaten + "Termin umbuchen" Button
- Wenn `isRebooking === true`: Buchungskalender darunter anzeigen
- Bei `bookMutation`: wenn existingAppointment vorhanden, zuerst den alten Termin loeschen (DELETE), dann neuen INSERT

### 2. 12-Stunden-Mindestvorlauf

In allen 3 Buchungsseiten:

Aktuell: `availableTimeSlots` filtert nur Slots die HEUTE in der Vergangenheit liegen.

Neu:
- Slots muessen mindestens 12 Stunden in der Zukunft liegen
- Fuer `isToday`: Slots filtern wo `slotTime > now + 12h` (bei heute wahrscheinlich alle weg)
- Fuer morgen: ebenfalls pruefen ob der Slot > 12h in der Zukunft ist
- Fuer uebermorgen+: alle Slots verfuegbar
- Kalender: Tage deaktivieren wo ALLE Slots < 12h Vorlauf haben (heute wird meistens deaktiviert)

Logik-Aenderung im `availableTimeSlots` useMemo:
```
const cutoff = new Date(now.getTime() + 12 * 60 * 60 * 1000);
// Fuer jedes selectedDate: Slot-DateTime berechnen und gegen cutoff pruefen
```

### 3. Blockierte Zeitfenster Bug fixen

**Problem**: Die Tabelle `schedule_blocked_slots` hat wahrscheinlich keine SELECT-Policy fuer `anon`-User. Die oeffentliche Buchungsseite `/bewerbungsgespraech/:id` wird ohne Login aufgerufen (anon), kann daher die blockierten Slots nicht lesen.

**Fix**: DB-Migration mit neuer RLS-Policy:
```sql
CREATE POLICY "Anon can read schedule_blocked_slots"
  ON public.schedule_blocked_slots
  FOR SELECT TO anon
  USING (true);
```

Gleiche Pruefung fuer `trial_day_blocked_slots` und `first_workday_blocked_slots` — laut Schema haben diese bereits `Anon can read` Policies (bei first_workday_blocked_slots sehe ich eine). Sicherheitshalber auch fuer `trial_day_blocked_slots` pruefen und ggf. hinzufuegen.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `Bewerbungsgespraech.tsx` | Umbuchen-Feature + 12h-Vorlauf |
| `Probetag.tsx` | Umbuchen-Feature + 12h-Vorlauf |
| `ErsterArbeitstag.tsx` | Umbuchen-Feature + 12h-Vorlauf |
| DB-Migration | Anon-SELECT-Policy fuer schedule_blocked_slots |

