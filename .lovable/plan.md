

## Plan: Buchungs-Bug auf allen drei Public-Booking-Seiten beheben (Bewerbungsgespräch, Probetag, Erster Arbeitstag)

### Problem
Auf den Public-Booking-Seiten werden bereits gebuchte Slots als **frei** angezeigt; beim Bestätigen kommt teilweise ein Fehler. Beispiel: `/bewerbungsgespraech/…` → 10:30, 10:50 frei, obwohl belegt.

### Ursachen
1. **1000-Zeilen-Limit:** Die Seiten laden zuerst `applications` bzw. `employment_contracts` eines Brandings und joinen client-seitig die Termin-Tabellen. Branding `e4f832ef…` hat aktuell **1134 Bewerbungen** → die Liste wird bei 1000 abgeschnitten → viele gebuchte Termine erscheinen als frei.
2. **Public-Page-Architektur verletzt:** `Bewerbungsgespraech.tsx` und `Probetag.tsx` nutzen den authentifizierten `supabase`-Client statt `publicSupabase`. Laut Memory `tech/public-booking-architecture` führt das zu sporadischen Insert-Fehlern / JWT-Konflikten beim Bestätigen. (`ErsterArbeitstag.tsx` nutzt bereits `publicSupabase` korrekt — dort fehlt nur die Slot-RPC für Probetag-Konflikte.)

### Lösung

**1. Neue SECURITY DEFINER RPCs (analog zur bestehenden `booked_slots_for_branding`):**

```sql
-- Bewerbungsgespräch
CREATE OR REPLACE FUNCTION public.interview_booked_slots_for_branding(_branding_id uuid)
RETURNS TABLE(appointment_date date, appointment_time time)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ia.appointment_date, ia.appointment_time
  FROM interview_appointments ia
  JOIN applications a ON a.id = ia.application_id
  WHERE a.branding_id = _branding_id
$$;

-- Probetag
CREATE OR REPLACE FUNCTION public.trial_day_booked_slots_for_branding(_branding_id uuid)
RETURNS TABLE(appointment_date date, appointment_time time)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT tda.appointment_date, tda.appointment_time
  FROM trial_day_appointments tda
  JOIN applications a ON a.id = tda.application_id
  WHERE a.branding_id = _branding_id
$$;

GRANT EXECUTE ON FUNCTION public.interview_booked_slots_for_branding(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trial_day_booked_slots_for_branding(uuid) TO anon, authenticated;
```

Die bestehende `booked_slots_for_branding` (für ersten Arbeitstag) bleibt — sie deckt bereits Probetag- + Erstarbeitstag-Konflikte für den Erstarbeitstag-Slot-Picker ab und nutzt direkten subselect ohne 1000-Limit-Problem (subselects sind nicht limitiert).

**2. `src/pages/Bewerbungsgespraech.tsx`**
- Import `supabase` → **`publicSupabase`** für **alle** DB-Calls (application, scheduleSettings, bookedSlots, blockedSlotsData, bookMutation, RPCs `update_application_status` / `update_application_phone`, sms_templates, brandings).
- `bookedSlots`-Query ersetzen durch `publicSupabase.rpc("interview_booked_slots_for_branding", { _branding_id })`.

**3. `src/pages/Probetag.tsx`**
- Import `supabase` → **`publicSupabase`** für alle DB-Calls.
- `bookedSlots`-Query ersetzen durch `publicSupabase.rpc("trial_day_booked_slots_for_branding", { _branding_id })`.

**4. `src/pages/ErsterArbeitstag.tsx`**
- Bereits auf `publicSupabase` und nutzt bereits `booked_slots_for_branding` RPC → **keine Änderung nötig**, nur kurz verifizieren.

**5. `src/pages/BewerbungsgespraechPublic.tsx`** (Vorstufe der Bewerbungsgespräch-Buchung)
- Branding-Fetch ebenfalls auf `publicSupabase` umstellen (Konsistenz mit Public-Page-Regel).

### Was NICHT geändert wird
- Keine UI-/Layout-Änderungen
- Keine Änderung an Slot-Generierung, 12-Stunden-Vorlauf, Wochenend-Logik, Rebooking-Flow, E-Mail/SMS/Telegram-Versand
- Keine Änderung an `schedule_blocked_slots` / `trial_day_blocked_slots` / `first_workday_blocked_slots`
- Andere Seiten (Admin-Bereich) bleiben unverändert

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| Neue Migration | RPCs `interview_booked_slots_for_branding` + `trial_day_booked_slots_for_branding` (+ GRANT anon/authenticated) |
| `src/pages/Bewerbungsgespraech.tsx` | Auf `publicSupabase` umstellen + `bookedSlots` via RPC |
| `src/pages/Probetag.tsx` | Auf `publicSupabase` umstellen + `bookedSlots` via RPC |
| `src/pages/BewerbungsgespraechPublic.tsx` | Branding-Fetch auf `publicSupabase` |
| `src/pages/ErsterArbeitstag.tsx` | Verifizieren — voraussichtlich keine Änderung |

### Erwartetes Ergebnis
- Auf allen drei Buchungsseiten werden belegte Slots korrekt als gebucht/grau angezeigt — auch bei Brandings mit > 1000 Bewerbungen/Verträgen.
- Klick auf „Bestätigen" funktioniert ohne JWT-/Session-Konflikt-Fehler.
- Buchungsraten erholen sich, weil Bewerber/Mitarbeiter nicht mehr versuchen, längst belegte Slots zu buchen.

