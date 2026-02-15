

# Bankverbindung-Card erweitern: Gehaltsauszahlungen

## Uebersicht

Die Bankverbindung-Sektion wird zu einem zweispaltigen Layout umgebaut. Links bleibt die Bankkarte, rechts kommt eine Tabelle mit Gehaltsauszahlungen. Da es aktuell keine separate Auszahlungs-Tabelle in der Datenbank gibt, wird ein Platzhalter-Zustand angezeigt.

## Aufbau

```text
+---------------------------+----------------------------------+
|                           |                                  |
|   [Bankkarte]             |   Gehaltsauszahlungen            |
|   IBAN, BIC, Bank         |                                  |
|   Name                    |   Anstehende Auszahlung          |
|                           |   am 01.03.2026                  |
|                           |   Betrag: €XX.XX                 |
|                           |                                  |
+---------------------------+----------------------------------+
```

## Logik fuer "Anstehende Auszahlung"

- **Datum**: Immer der 1. des naechsten Monats (berechnet mit `date-fns`)
- **Betrag**: Summe aller Praemien aus Auftraegen mit Status "erfolgreich" in `order_assignments`, deren zugehoerige `order_reviews` im aktuellen Monat erstellt wurden
  - Query: `order_assignments` (status = "erfolgreich", contract_id = eigene) verbunden mit `orders` (fuer `reward`-Feld) und `order_reviews` (fuer `created_at` im aktuellen Monat)
  - Das `reward`-Feld ist ein String (z.B. "5€"), wird geparst wie auf anderen Seiten

## Technische Umsetzung

### Datei: `src/pages/mitarbeiter/MeineDaten.tsx`

1. **Layout-Aenderung**: Die Bankverbindungs-Card bekommt ein `grid grid-cols-1 lg:grid-cols-2 gap-6` Layout
   - Linke Spalte: Bestehende Bankkarten-Visualisierung (max-w-md Begrenzung entfernen)
   - Rechte Spalte: Auszahlungs-Bereich

2. **Neuer Daten-Fetch**: Zusaetzlich zu den bestehenden Queries werden geladen:
   - `order_assignments` mit Status "erfolgreich" fuer die eigene `contract_id`
   - `orders` fuer die zugehoerigen `reward`-Werte
   - `order_reviews` mit `created_at` im aktuellen Monat zur Filterung

3. **Anstehende Auszahlung berechnen**:
   - Naechster Monatserster mit `date-fns` (`startOfMonth`, `addMonths`, `format`)
   - Praemien-Summe: Alle erfolgreich abgeschlossenen Auftraege des aktuellen Monats summieren
   - Reward-String parsen (gleiche Logik wie in `MitarbeiterDashboard.tsx`)

4. **Anzeige**:
   - Ueberschrift "Gehaltsauszahlungen"
   - Wenn keine vergangenen Auszahlungen: Hinweis-Box mit "Anstehende Gehaltsauszahlung am DD.MM.YYYY" und dem berechneten Betrag
   - Formatierung: Datum im deutschen Format (01.03.2026), Betrag als €XX.XX

### Keine DB-Aenderungen noetig
Alle Daten koennen aus bestehenden Tabellen berechnet werden. Die RLS-Policies erlauben dem Mitarbeiter bereits Lesezugriff auf seine eigenen `order_assignments`, `orders` und `order_reviews`.

