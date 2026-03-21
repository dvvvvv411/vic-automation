

## Plan: 30-Minuten-Takt für Zeitauswahl + separate Wochenendzeiten

### 1. TIME_OPTIONS auf 30-Minuten-Takt erweitern

**Betroffene Dateien:**
- `src/pages/admin/AdminZeitplan.tsx`
- `src/components/admin/TrialDayBlocker.tsx`

Aktuell:
```typescript
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
```
Neu: 48 Einträge (00:00, 00:30, 01:00, 01:30, ..., 23:30):
```typescript
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = (i % 2) * 30;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});
```

### 2. Separate Wochenendzeiten (Sa/So)

**Datenbank-Migration**: Zwei neue Spalten in `branding_schedule_settings`:
- `weekend_start_time` (time, default NULL)
- `weekend_end_time` (time, default NULL)

Wenn NULL, gelten die normalen `start_time`/`end_time`. Wenn gesetzt, gelten diese Zeiten für Sa (6) und So (7).

**Admin UI** (`AdminZeitplan.tsx` BrandingScheduleForm + `TrialDayBlocker.tsx`):
- Unter den Wochentag-Checkboxen einen neuen Abschnitt "Wochenendzeiten (Sa & So)" anzeigen, wenn Sa oder So aktiviert ist.
- Zwei zusätzliche Select-Felder: Startzeit Wochenende, Endzeit Wochenende.
- Beim Speichern `weekend_start_time` und `weekend_end_time` mitsenden.

**Booking-Seiten** (`Bewerbungsgespraech.tsx` + `Probetag.tsx`):
- Beim Generieren der Zeitslots prüfen, ob der gewählte Tag Sa oder So ist.
- Falls ja und `weekend_start_time`/`weekend_end_time` gesetzt: diese Zeiten statt der normalen verwenden.

### 3. Zusammenfassung der Änderungen

| Datei | Änderung |
|---|---|
| `supabase/migrations/...` | `weekend_start_time` und `weekend_end_time` Spalten hinzufügen |
| `src/pages/admin/AdminZeitplan.tsx` | TIME_OPTIONS 30-Min-Takt, Wochenendzeiten-UI in BrandingScheduleForm, Speichern erweitern |
| `src/components/admin/TrialDayBlocker.tsx` | TIME_OPTIONS 30-Min-Takt, Wochenendzeiten-UI, Speichern erweitern |
| `src/pages/Bewerbungsgespraech.tsx` | Wochenendzeiten bei Slot-Generierung berücksichtigen |
| `src/pages/Probetag.tsx` | Wochenendzeiten bei Slot-Generierung berücksichtigen |

