

# Fix: Admin-Badges und Card-Inhalte im Mitarbeiter-Panel bereinigen

## Problem
Dem User werden interne Admin-Badges angezeigt (Platzhalter, order_type wie "Bankdrops", is_videochat). Ausserdem zeigen die Cards "Anbieter" statt Beschreibung, leere Auftragsnummern als "#", und 0€ Praemien.

## Aenderungen

### 1. `MitarbeiterDashboard.tsx`
- **Zeile 493-497**: `is_placeholder` Badge entfernen
- **Zeile 483-485**: Auftragsnummer-Badge nur anzeigen wenn `order.order_number` nicht leer
- **Zeile 508-511**: "Anbieter" ersetzen durch abgekuerzte Beschreibung (`order.description`, `line-clamp-2`); nur anzeigen wenn description vorhanden
- **Zeile 512-517**: Praemie-Zeile ausblenden wenn reward "0", "0€", "0 €" ist (zusaetzlich zur bestehenden `isFixedSalary` Pruefung)

### 2. `MitarbeiterAuftraege.tsx`
- **Interface Assignment** (Zeile 27): `description` Feld hinzufuegen
- **Query** (Zeile 154): `description` zur select-Liste hinzufuegen
- **Mapping** (Zeile ~180): `description` in Assignment-Objekt aufnehmen
- **Card** (Zeile ~309): Auftragsnummer nur wenn vorhanden; "Anbieter" durch Description ersetzen; 0€ ausblenden

### 3. `AuftragDetails.tsx`
- **Zeile 401-410**: `order_type` Badge und `is_videochat` Badge komplett entfernen (nur Admin-relevant)
- **Zeile 429-434**: Praemie-Zeile ausblenden wenn reward "0"/"0€"/"0 €"

### Betroffene Dateien
| Datei | Aenderung |
|-------|----------|
| `MitarbeiterDashboard.tsx` | is_placeholder Badge weg, # konditionell, Description statt Anbieter, 0€ weg |
| `MitarbeiterAuftraege.tsx` | description laden+anzeigen, # konditionell, 0€ weg |
| `AuftragDetails.tsx` | order_type + is_videochat Badges weg, 0€ weg |

