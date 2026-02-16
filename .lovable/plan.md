

# Admin-Sidebar in Gruppen strukturieren

## Aenderung

Die Navigation in der Admin-Sidebar wird in vier logische Gruppen mit Trennlinien (Separator) aufgeteilt, statt alle Links in einer einzigen Liste zu zeigen.

## Gruppen

1. **Uebersicht** - Dashboard
2. **Recruiting** - Bewerbungen, Bewerbungsgespraeche, Arbeitsvertraege
3. **Betrieb** - Mitarbeiter, Auftraege, Auftragstermine, Livechat, Bewertungen
4. **Einstellungen** - Brandings

## Technische Umsetzung

**Datei**: `src/components/admin/AdminSidebar.tsx`

- Das einzelne `navItems`-Array wird durch mehrere Gruppen-Arrays ersetzt, jeweils mit einem Label
- Jede Gruppe bekommt eine eigene `SidebarGroup` mit `SidebarGroupLabel`
- Zwischen den Gruppen wird ein `Separator` eingefuegt fuer visuelle Trennung
- Die Badge-Logik bleibt unveraendert

Struktur:

```
const navGroups = [
  {
    label: null,  // keine Ueberschrift fuer Uebersicht
    items: [Uebersicht]
  },
  {
    label: "Recruiting",
    items: [Bewerbungen, Bewerbungsgespraeche, Arbeitsvertraege]
  },
  {
    label: "Betrieb",
    items: [Mitarbeiter, Auftraege, Auftragstermine, Livechat, Bewertungen]
  },
  {
    label: "Einstellungen",
    items: [Brandings]
  }
]
```

Keine neuen Dateien oder Abhaengigkeiten noetig.

