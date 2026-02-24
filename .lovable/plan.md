

# Verbesserungen fuer AssignmentDialog, AdminMitarbeiter und AdminAuftraege

## Uebersicht

Vier Bereiche werden angepasst:
1. AssignmentDialog: Suchfunktion + Status-Filter korrigieren
2. /admin/mitarbeiter: Suchleiste + Sortierung + Startdatum-Spalte
3. /admin/auftraege: Zuweisungs-Dialog zeigt nur unterzeichnete Mitarbeiter

---

## 1. AssignmentDialog (`src/components/admin/AssignmentDialog.tsx`)

### Suchleiste hinzufuegen

- Neuer State `search` im Dialog
- Ein `Input`-Feld mit Such-Icon wird oberhalb der Checkbox-Liste eingefuegt
- Die angezeigte Liste wird clientseitig nach dem Suchbegriff gefiltert:
  - **mode="order"** (Mitarbeiter zuweisen): Suche nach Name und E-Mail
  - **mode="contract"** (Auftraege zuweisen): Suche nach Auftragsnummer, Titel und Anbieter

### Status-Filter korrigieren

- Zeile 52: `.eq("status", "genehmigt")` aendern zu `.eq("status", "unterzeichnet")`
- Damit werden nur Mitarbeiter angezeigt, die den Vertrag tatsaechlich unterzeichnet haben
- Leermeldung (Zeile 201) entsprechend anpassen

### Auftraege-Query erweitern

- Zeile 61: `select("id, order_number, title")` erweitern um `provider`
- Das `sublabel` zeigt dann den Anbieter an
- Suche kann so auch ueber den Anbieter filtern

### Suchfeld zuruecksetzen

- `search` wird auf `""` zurueckgesetzt wenn der Dialog geoeffnet/geschlossen wird (im `useEffect`)

---

## 2. AdminMitarbeiter (`src/pages/admin/AdminMitarbeiter.tsx`)

### Suchleiste

- Neuer State `search`
- Ein `Input`-Feld mit Such-Icon zwischen Header und Tabelle
- Clientseitige Filterung nach Name, E-Mail, Telefon und Branding

### Sortierung: Unterzeichnet zuerst

- `useMemo` das die geladenen Items sortiert:
  - `unterzeichnet` (Rang 0) vor `genehmigt` (Rang 1)
  - Innerhalb gleicher Gruppe: alphabetisch nach Nachname

### Startdatum-Spalte

- Neue Tabellenspalte "Startdatum" nach "Status"
- Wert kommt aus `desired_start_date` des Vertrags (muss in der Query ergaenzt werden)
- Query erweitern: `desired_start_date` zum Select hinzufuegen
- Formatierung als deutsches Datum oder "–" wenn leer
- Sortierung innerhalb gleicher Status-Gruppe: zukuenftige Startdaten aufsteigend, vergangene absteigend (gleiche Logik wie bei Arbeitsvertraege)

---

## 3. Technische Details

### AssignmentDialog - Aenderungen

```text
Neuer Import: Input, Search (lucide-react)
Neuer State: search (useState "")
Query Zeile 52: "genehmigt" -> "unterzeichnet"
Query Zeile 61: select erweitern um "provider"
sublabel fuer orders: Anbieter anzeigen
Suchfeld zwischen DialogHeader und ScrollArea
filteredItems = items.filter(nach search)
ScrollArea mappt ueber filteredItems statt items
```

### AdminMitarbeiter - Aenderungen

```text
Neue Imports: Input, Search, useMemo
Neuer State: search
Query erweitern: desired_start_date in select
Suchfeld zwischen Header und Tabelle
useMemo fuer Sortierung (Status + Startdatum)
filteredItems = sortedItems.filter(nach search)
Neue TableHead: Startdatum
Neue TableCell: formatiertes Datum
```

Keine neuen Dateien oder Abhaengigkeiten noetig. Alle Aenderungen sind rein clientseitig.

