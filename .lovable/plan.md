

# Dashboard StatusButton + Appointment-Logik bereinigen

## Problem
`MitarbeiterDashboard.tsx` hat noch die alte `StatusButton`-Komponente mit `isPlaceholder`/`hasAppointment`-Unterscheidung und zeigt "Termin buchen" an.

## Änderungen in `src/pages/mitarbeiter/MitarbeiterDashboard.tsx`

1. **StatusButton vereinfachen** (Zeilen 45-112): `isPlaceholder` und `hasAppointment` Props entfernen. Der `default`-Case wird zu einem einheitlichen "Auftrag starten" Button:
```tsx
const StatusButton = ({ status, orderId, navigate }: { 
  status: string; orderId: string; navigate: (path: string) => void 
}) => {
  switch (status) {
    // in_pruefung, erfolgreich, fehlgeschlagen bleiben gleich
    default:
      return (
        <Button className="w-full mt-2 rounded-xl group/btn bg-gradient-to-r ..." size="sm"
          onClick={() => navigate(`/mitarbeiter/auftragdetails/${orderId}`)}>
          Auftrag starten
          <ExternalLink ... />
        </Button>
      );
  }
};
```

2. **Appointment-Daten entfernen**: `order_appointments` Fetch, `apptMap`, `appointment`-Feld im Order-Mapping, und die Termin-Badge im Card-Body (CalendarCheck mit Datum/Uhrzeit) entfernen.

3. **StatusButton-Aufruf bereinigen**: `isPlaceholder` und `hasAppointment` Props aus dem JSX-Aufruf entfernen.

4. **Ungenutzte Imports entfernen**: `CalendarCheck`, `Eye`, `format`, `de` (falls nur für Appointments genutzt).

