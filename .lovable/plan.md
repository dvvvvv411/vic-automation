

# Auftrag-Buttons auf /mitarbeiter aktualisieren

## Problem
Die `StatusButton`-Komponente in `MitarbeiterAuftraege.tsx` unterscheidet noch zwischen "Termin buchen" (kein Appointment) und "Auftrag ansehen" (hat Appointment). Da Terminbuchung entfernt wurde, brauchen wir nur noch einen einheitlichen Button für offene Aufträge.

## Änderungen

### `src/pages/mitarbeiter/MitarbeiterAuftraege.tsx`

**StatusButton vereinfachen** (Zeilen 61-127): Die `hasAppointment`/`isPlaceholder`-Unterscheidung im `default`-Case entfernen. Für alle offenen Aufträge einen einheitlichen "Auftrag starten" Button anzeigen:

```tsx
default:
  return (
    <Button
      className="w-full mt-2 rounded-xl group/btn bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
      size="sm"
      onClick={() => navigate(`/mitarbeiter/auftragdetails/${orderId}`)}
    >
      Auftrag starten
      <ExternalLink className="h-3.5 w-3.5 ml-1.5 opacity-60 group-hover/btn:opacity-100 transition-opacity" />
    </Button>
  );
```

**Props bereinigen**: `isPlaceholder` und `hasAppointment` aus StatusButton entfernen.

**Appointment-Daten entfernen**: 
- `order_appointments` Fetch (Zeilen ~148-152) entfernen
- `appointment`-Feld aus Assignment-Interface und Mapping entfernen
- Termin-Badge im Card-Body (CalendarCheck mit Datum/Uhrzeit) entfernen
- Ungenutzte Imports entfernen: `CalendarCheck`

