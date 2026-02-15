

# Dashboard: Auftraege "In Ueberpruefung" anzeigen

## Problem

Auf dem Mitarbeiter-Dashboard werden unter "Deine Auftraege" nur Auftraege mit Status "offen" und "fehlgeschlagen" angezeigt. Auftraege mit Status "in_pruefung" fehlen, obwohl der Mitarbeiter sehen sollte, welche Tests gerade ueberprueft werden.

## Aenderung

### Datei: `src/pages/mitarbeiter/MitarbeiterDashboard.tsx`

Eine einzige Zeile wird angepasst -- der Filter fuer `dashboardOrders` wird um `in_pruefung` erweitert:

**Vorher:**
```
orders.filter(o => o.assignment_status === "offen" || o.assignment_status === "fehlgeschlagen")
```

**Nachher:**
```
orders.filter(o => o.assignment_status === "offen" || o.assignment_status === "fehlgeschlagen" || o.assignment_status === "in_pruefung")
```

Der Untertitel "X Auftraege mit Handlungsbedarf" passt weiterhin, da "in_pruefung"-Auftraege ebenfalls relevant fuer den Mitarbeiter sind. Die bestehenden `StatusBadge` und `StatusButton` Komponenten behandeln "in_pruefung" bereits korrekt (gelbes Badge, deaktivierter Button mit "In Ueberpruefung").

