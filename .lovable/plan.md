

## Plan: Probetag-Buchung sieht keine vertragsbasierten 1. Arbeitstag-Termine

### Problem

`Probetag.tsx` (Zeile 108-111) holt gebuchte Slots manuell:
- `trial_day_appointments` gefiltert nach `application_id` ✅
- `first_workday_appointments` gefiltert nach `application_id` ❌

Neuere 1. Arbeitstag-Termine sind aber über `contract_id` verknüpft (nicht `application_id`). Diese werden komplett übersehen → Doppelbuchung möglich.

`ErsterArbeitstag.tsx` nutzt korrekt die RPC-Funktion `booked_slots_for_branding`, die alle Varianten abdeckt.

### Fix

**Datei:** `src/pages/Probetag.tsx` (Zeile 98-117)

Die manuelle Query durch denselben RPC-Aufruf `booked_slots_for_branding` ersetzen, der bereits alle trial_day + first_workday Appointments (sowohl application_id als auch contract_id basiert) abdeckt.

```typescript
const { data: bookedSlots } = useQuery({
  queryKey: ["trial-day-booked-slots", brandingId],
  enabled: !!brandingId,
  queryFn: async () => {
    const { data, error } = await supabase.rpc("booked_slots_for_branding" as any, {
      _branding_id: brandingId!,
    });
    if (error) throw error;
    return (data || []) as Array<{ appointment_date: string; appointment_time: string }>;
  },
});
```

Das ersetzt die 15-zeilige manuelle Query durch einen einzigen RPC-Aufruf und stellt sicher, dass beide Termintypen korrekt blockiert werden.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/Probetag.tsx` | Booked-Slots Query durch `booked_slots_for_branding` RPC ersetzen |

