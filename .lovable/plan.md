

# Auftraege-Seite Redesign

## Problem

Die aktuelle Seite nutzt eine unschoene Tabelle und fuenf Tabs, die unnoetig Platz verbrauchen. Das Dashboard hat bereits schoene Cards -- die Auftraege-Seite sollte dem gleichen Stil folgen.

## Loesung

Die gesamte `MitarbeiterAuftraege.tsx` wird ueberarbeitet:

### Aenderungen

**Tabs entfernen, Select-Dropdown einbauen**
- Statt 5 Tabs: Ein einzelnes `Select`-Dropdown ("Alle Status", "Offen", "In Ueberpruefung", "Erfolgreich", "Fehlgeschlagen") in der Header-Zeile neben dem Titel
- Kompakter und moderner

**Tabelle durch Cards ersetzen**
- Responsive Grid (1 Spalte mobil, 2 Spalten Tablet, 3 Spalten Desktop) -- gleicher Stil wie im Dashboard
- Jede Card zeigt: Auftragsnummer (Badge), Titel, Anbieter, Praemie, Status-Badge und Aktions-Button
- Farbiger Top-Stripe auf jeder Card (wie im Dashboard)
- Framer-Motion Animationen fuer staggered Einblendung

**Betroffene Datei**: `src/pages/mitarbeiter/MitarbeiterAuftraege.tsx` (komplett ueberarbeitet, gleicher Daten-Fetch bleibt)

### Design-Referenz

Das Layout orientiert sich exakt am Dashboard-Kartenstil aus `MitarbeiterDashboard.tsx`:
- Card mit `border-border/60`, `shadow-sm`, `hover:shadow-lg`, `hover:-translate-y-1`
- Gradient-Stripe oben
- Badge fuer Auftragsnummer, Status-Badge rechts
- Anbieter/Praemie als Key-Value-Zeilen
- Aktions-Button am unteren Rand (Starten / Erneut / In Ueberpruefung / Erfolgreich)

