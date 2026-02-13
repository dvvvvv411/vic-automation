

# Auftragszuweisung: Mitarbeiter <-> Auftraege

## Uebersicht

Neue Verknuepfungstabelle `order_assignments`, um Auftraege an Mitarbeiter zuzuweisen. Beide Admin-Seiten (Auftraege und Mitarbeiter) erhalten einen "Zuweisen"-Button mit einem Dialog zur Auswahl.

## 1. Datenbank

### Neue Tabelle: `order_assignments`

| Spalte | Typ | Pflicht | Default |
|---|---|---|---|
| id | uuid | ja | gen_random_uuid() |
| order_id | uuid | ja | FK -> orders.id |
| contract_id | uuid | ja | FK -> employment_contracts.id |
| assigned_at | timestamptz | ja | now() |

- Unique Constraint auf (order_id, contract_id) um doppelte Zuweisungen zu verhindern
- ON DELETE CASCADE fuer beide Foreign Keys
- RLS: Nur Admins duerfen SELECT, INSERT, DELETE

## 2. AdminAuftraege.tsx -- Neue Spalte "Zuweisen"

### Aenderungen
- Neue Tabellenspalte "Zuweisen" nach "Erstellt am"
- Button "Zuweisen" oeffnet einen Dialog
- Der Dialog laedt alle genehmigten Mitarbeiter aus `employment_contracts` (status = 'genehmigt')
- Zeigt eine Liste mit Checkboxen: Name + E-Mail
- Bereits zugewiesene Mitarbeiter sind vorausgewaehlt (geladen aus `order_assignments`)
- Speichern: Loescht alte Zuweisungen fuer diesen Auftrag und fuegt die neuen ein
- In der Tabellenzelle wird die Anzahl zugewiesener Mitarbeiter als Badge angezeigt (z.B. "3 Mitarbeiter")

### Daten
- Query erweitert: Orders werden mit einem Count der Zuweisungen geladen
- Zusaetzlicher Query beim Oeffnen des Dialogs: Alle Mitarbeiter + aktuelle Zuweisungen fuer den Auftrag

## 3. AdminMitarbeiter.tsx -- Neue Spalte "Auftrag zuweisen"

### Aenderungen
- Neue Tabellenspalte "Auftraege" nach "Status"
- Button "Zuweisen" oeffnet einen Dialog
- Der Dialog laedt alle Auftraege aus `orders`
- Zeigt eine Liste mit Checkboxen: Auftragsnummer + Titel
- Bereits zugewiesene Auftraege sind vorausgewaehlt
- Speichern: Loescht alte Zuweisungen fuer diesen Mitarbeiter und fuegt die neuen ein
- In der Tabellenzelle wird die Anzahl zugewiesener Auftraege als Badge angezeigt

## Technische Details

| Datei | Aenderung |
|---|---|
| Migration | CREATE TABLE order_assignments mit RLS-Policies, FK, Unique Constraint |
| `src/pages/admin/AdminAuftraege.tsx` | Neue Spalte + Zuweisungs-Dialog mit Mitarbeiter-Checkboxen |
| `src/pages/admin/AdminMitarbeiter.tsx` | Neue Spalte + Zuweisungs-Dialog mit Auftrags-Checkboxen |

### Ablauf des Zuweisungs-Dialogs (identisch auf beiden Seiten, nur Perspektive gedreht)

```text
+-----------------------------------+
|  Auftrag zuweisen                 |
|  (oder: Mitarbeiter zuweisen)     |
|                                   |
|  [x] Max Mustermann (max@...)     |
|  [ ] Erika Muster (erika@...)     |
|  [x] Hans Mueller (hans@...)      |
|                                   |
|  [Abbrechen]  [Speichern]         |
+-----------------------------------+
```

- Beim Oeffnen werden bestehende Zuweisungen geladen und als checked dargestellt
- Beim Speichern werden alle alten Zuweisungen (fuer den jeweiligen Auftrag bzw. Mitarbeiter) geloescht und die aktuell angehakten neu eingefuegt
- Beide Seiten invalidieren den Query-Cache der jeweils anderen Seite mit

