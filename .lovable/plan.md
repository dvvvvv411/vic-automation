
# Dashboard: "Meine Daten" Card ersetzen durch "Gehaltsauszahlung" Card

## Aenderung

Die `DashboardProfileSummary`-Komponente wird aus dem Dashboard entfernt und durch eine neue `DashboardPayoutSummary`-Komponente ersetzt, die den voraussichtlichen Auszahlungsbetrag und das naechste Auszahlungsdatum (1. des Folgemonats) anzeigt.

## Technische Umsetzung

### 1. Neue Komponente erstellen: `src/components/mitarbeiter/DashboardPayoutSummary.tsx`

- Zeigt eine kompakte Card mit:
  - Naechstes Auszahlungsdatum (1. des Folgemonats, berechnet mit `addMonths` + `startOfMonth`)
  - Voraussichtlicher Betrag (basierend auf dem aktuellen Guthaben/Balance)
- Button "Details" verlinkt zu `/mitarbeiter/meine-daten`
- Gleicher Stil wie die bestehende `DashboardReviewsSummary`

### 2. Dashboard anpassen: `src/pages/mitarbeiter/MitarbeiterDashboard.tsx`

- Import von `DashboardProfileSummary` entfernen
- Import von `DashboardPayoutSummary` hinzufuegen
- In der Summary-Section `DashboardProfileSummary` durch `DashboardPayoutSummary` ersetzen
- Die `profileSummary` State-Variable und deren Befuellung kann entfernt werden (wird nicht mehr benoetigt)
- `balance` wird an die neue Komponente weitergereicht

### 3. Alte Komponente aufraumen

- `DashboardProfileSummary.tsx` wird geloescht, da sie nicht mehr verwendet wird
