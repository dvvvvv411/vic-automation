

## Plan: /erster-arbeitstag fuer eingeloggte User (Rolle `user`) vollstaendig nutzbar machen

### Problem
Eingeloggte Mitarbeiter (Rolle `user`) koennen die Seite `/erster-arbeitstag/:id` nicht vollstaendig nutzen, weil mehrere Datenbankabfragen an RLS-Policies scheitern:

1. **bookedSlots-Query scheitert**: Die Seite fragt ALLE `employment_contracts` und `applications` eines Brandings ab (Zeilen 106-131), um belegte Slots zu berechnen. Ein `user` darf aber nur seinen eigenen Vertrag sehen — die Query liefert daher fast leere Ergebnisse oder Fehler.
2. **Umbuchen (DELETE) scheitert**: Beim Umbuchen wird der alte `first_workday_appointments`-Datensatz geloescht. Es gibt keine DELETE-Policy fuer die `user`-Rolle.
3. **SMS-Template-Abfrage scheitert**: Nach der Buchung wird ein SMS-Template gelesen (`sms_templates`). Ohne Leserecht fuer `user` schlaegt das fehl (die Buchung selbst funktioniert, aber die SMS wird nicht gesendet).

### Loesung

#### 1. Neue SECURITY DEFINER Funktion fuer gebuchte Slots
Erstellt eine DB-Funktion `booked_slots_for_branding(_branding_id uuid)` die alle belegten Termine eines Brandings zurueckgibt — ohne dass der User direkten Lesezugriff auf fremde Vertraege braucht.

#### 2. DELETE-Policy fuer eigene first_workday_appointments
Erlaubt `user`-Rolle das Loeschen eigener Termine (wo `contract_id` zum eigenen Vertrag gehoert).

#### 3. SELECT-Policy fuer sms_templates
Erlaubt allen authentifizierten Usern das Lesen von SMS-Templates (enthalten keine sensiblen Daten).

#### 4. Frontend: bookedSlots-Query auf RPC umstellen
In `ErsterArbeitstag.tsx` die komplexe Multi-Table-Query (Zeilen 100-143) durch einen einzelnen `supabase.rpc('booked_slots_for_branding', ...)` Aufruf ersetzen.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `supabase/migrations/[new].sql` | RPC-Funktion `booked_slots_for_branding`, DELETE-Policy auf `first_workday_appointments`, SELECT-Policy auf `sms_templates` |
| `src/pages/ErsterArbeitstag.tsx` | bookedSlots-Query (Zeilen 100-143) auf `supabase.rpc(...)` umstellen |

### Technische Details

```sql
-- 1. Security definer function for booked slots
CREATE OR REPLACE FUNCTION public.booked_slots_for_branding(_branding_id uuid)
RETURNS TABLE(appointment_date date, appointment_time time)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT fwa.appointment_date, fwa.appointment_time
  FROM first_workday_appointments fwa
  WHERE fwa.contract_id IN (
    SELECT id FROM employment_contracts WHERE branding_id = _branding_id
  )
  UNION
  SELECT fwa.appointment_date, fwa.appointment_time
  FROM first_workday_appointments fwa
  WHERE fwa.application_id IN (
    SELECT id FROM applications WHERE branding_id = _branding_id
  )
  UNION
  SELECT tda.appointment_date, tda.appointment_time
  FROM trial_day_appointments tda
  WHERE tda.application_id IN (
    SELECT id FROM applications WHERE branding_id = _branding_id
  )
$$;

-- 2. User can delete own first_workday_appointments for rebooking
CREATE POLICY "Users can delete own first_workday_appointments"
ON public.first_workday_appointments FOR DELETE TO authenticated
USING (
  contract_id IN (
    SELECT id FROM employment_contracts WHERE user_id = auth.uid()
  )
);

-- 3. All authenticated users can read sms_templates
CREATE POLICY "Authenticated can read sms_templates"
ON public.sms_templates FOR SELECT TO authenticated
USING (true);
```

Frontend-Aenderung in `ErsterArbeitstag.tsx`:
- Zeilen 100-143 ersetzen durch: `supabase.rpc('booked_slots_for_branding', { _branding_id: brandingId })`
- Ergebnis direkt als `bookedSlots` verwenden (gleiche Spalten `appointment_date`, `appointment_time`)

