

# Bewertungs-Workflow mit Status, Genehmigung und Kontoguthaben

## Uebersicht

Nach dem Absenden einer Bewertung geht der Auftrag in den Status "in_pruefung". Admins koennen Bewertungen genehmigen oder ablehnen. Bei Genehmigung wird die Praemie dem Mitarbeiter-Kontoguthaben gutgeschrieben. Bei Ablehnung kann der Mitarbeiter die Bewertung erneut durchfuehren.

## 1. Datenbank-Aenderungen

### Neue Spalte: `order_assignments.status`
- Typ: `text`, Default: `offen`
- Moegliche Werte: `offen`, `in_pruefung`, `fehlgeschlagen`, `erfolgreich`

### Neue Spalte: `employment_contracts.balance`
- Typ: `numeric(10,2)`, Default: `0`
- Speichert das Kontoguthaben des Mitarbeiters

### RLS-Policy-Erweiterung
- Users: UPDATE auf `order_assignments` fuer eigene Eintraege (noetig um Status auf `in_pruefung` zu setzen)
- Admins: UPDATE auf `order_assignments` bereits vorhanden

## 2. Ablauf

```text
Mitarbeiter bewertet Auftrag
        |
        v
Status -> "in_pruefung"
        |
        v
Admin prueft unter /admin/bewertungen
       / \
      /   \
Genehmigen  Ablehnen
     |         |
     v         v
"erfolgreich"  "fehlgeschlagen"
+ Praemie      Mitarbeiter kann
  gutschreiben  erneut bewerten
```

## 3. Datei-Aenderungen

| Datei | Aenderung |
|---|---|
| **Migration** | `status` auf `order_assignments` + `balance` auf `employment_contracts` + RLS-Policy fuer User-UPDATE auf `order_assignments` |
| `src/pages/mitarbeiter/Bewertung.tsx` | Nach Insert der Reviews: `order_assignments.status` auf `in_pruefung` setzen |
| `src/pages/mitarbeiter/MitarbeiterDashboard.tsx` | Status pro Auftrag laden (via Join auf `order_assignments`), Button-Text je nach Status aendern: "Auftrag starten" / "In Ueberprüfung" (disabled) / "Erneut bewerten" / "Erfolgreich" (disabled) |
| `src/pages/mitarbeiter/AuftragDetails.tsx` | Status laden und "Bewertung starten"-Button entsprechend anpassen; bei `fehlgeschlagen` erneutes Bewerten ermoeglichen (alte Reviews loeschen oder neue erlauben) |
| `src/pages/mitarbeiter/Bewertung.tsx` | Bei erneutem Bewerten: alte Reviews loeschen vor neuem Insert |
| `src/pages/admin/AdminBewertungen.tsx` | Aktion-Spalte: "Genehmigen"/"Ablehnen" Buttons statt nur "Details"; bei Genehmigung: Status auf `erfolgreich` setzen + Praemie auf `balance` addieren; bei Ablehnung: Status auf `fehlgeschlagen` + alte Reviews loeschen |
| `src/components/admin/AdminSidebar.tsx` | Badge mit Anzahl der Bewertungen im Status `in_pruefung` am "Bewertungen"-Reiter |
| `src/integrations/supabase/types.ts` | Typen fuer neue Spalten aktualisieren |

## 4. Technische Details

### Dashboard-Button-Logik (MitarbeiterDashboard)
- `offen` -> "Auftrag starten" (navigiert zu Details)
- `in_pruefung` -> "In Ueberprüfung" (gelber Badge, disabled)
- `fehlgeschlagen` -> "Erneut bewerten" (rot, navigiert zu Details)
- `erfolgreich` -> "Erfolgreich" (gruener Badge, disabled)

### Admin Genehmigung
- Praemie wird aus `orders.reward` geparst (z.B. "50€" -> 50.00)
- UPDATE `employment_contracts SET balance = balance + praemie WHERE id = contract_id`
- UPDATE `order_assignments SET status = 'erfolgreich' WHERE ...`

### Admin Ablehnung
- UPDATE `order_assignments SET status = 'fehlgeschlagen'`
- DELETE alte Reviews aus `order_reviews` fuer diese order_id + contract_id Kombination
- Mitarbeiter kann dann erneut `/mitarbeiter/bewertung/:id` aufrufen

### Badge im Sidebar
- Query: `SELECT count(*) FROM order_assignments WHERE status = 'in_pruefung'`
- Polling alle 30 Sekunden (gleich wie andere Badges)

### RLS fuer Reviews-Loeschung
- Neue DELETE-Policy auf `order_reviews` fuer Admins erforderlich

