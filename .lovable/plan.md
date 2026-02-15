
# Dashboard-Filter: Nur relevante Auftraege anzeigen

## Aenderungen in `src/pages/mitarbeiter/MitarbeiterDashboard.tsx`

### 1. Auftraege-Liste filtern
Im Bereich "Deine Auftraege" werden nur noch Auftraege mit Status `offen` oder `fehlgeschlagen` angezeigt. Erfolgreiche und in Pruefung befindliche Auftraege werden ausgeblendet -- dafuer gibt es die dedizierte Auftraege-Seite unter `/mitarbeiter/auftraege`.

Konkret: Vor dem Rendern des Order-Grids wird eine gefilterte Liste erstellt:
```text
const dashboardOrders = orders.filter(o => 
  o.assignment_status === "offen" || o.assignment_status === "fehlgeschlagen"
);
```
Diese gefilterte Liste wird fuer das Grid und die Zaehlung "X Auftraege zugewiesen" verwendet.

### 2. Statistik-Card "Offene Auftraege" anpassen
Die Card "Offene Auftraege" zaehlt aktuell nur `offen`. Sie wird erweitert um auch `fehlgeschlagen` einzubeziehen, da diese ebenfalls Handlungsbedarf haben:

- **Wert**: Anzahl der Auftraege mit Status `offen` ODER `fehlgeschlagen`
- **Detail-Text**: "Handlungsbedarf" statt "Bereit zum Starten"

### Betroffene Datei
| Datei | Aenderung |
|---|---|
| `src/pages/mitarbeiter/MitarbeiterDashboard.tsx` | Zeile 145: Filter fuer "Offene Auftraege" um `fehlgeschlagen` erweitern; Auftraege-Grid mit gefilterter Liste (`offen` + `fehlgeschlagen`) rendern |
