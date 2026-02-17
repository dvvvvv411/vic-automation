
# Unterschriebenen Arbeitsvertrag in "Meine Daten" anzeigen

## Problem
Der unterschriebene Vertrag von fabian@teilzeit.de ist in der Datenbank vorhanden (Status: "unterzeichnet", signed_contract_pdf_url gesetzt), aber die Seite "Meine Daten" zeigt keinen Bereich zum Ansehen oder Herunterladen des Vertrags an. Das `FileDown`-Icon ist bereits importiert, wird aber nicht verwendet.

## Loesung
Ein neuer Abschnitt "Arbeitsvertrag" wird in der Seite MeineDaten eingefuegt, der den unterschriebenen Vertrag als Download-Button anbietet.

## Aenderungen

**Datei:** `src/pages/mitarbeiter/MeineDaten.tsx`

### 1. Vertragsdaten aus dem Context nutzen
- Die Variable `contract` aus dem OutletContext enthaelt bereits `signed_contract_pdf_url`
- Kein zusaetzlicher Datenbank-Aufruf noetig

### 2. Neuen Abschnitt "Arbeitsvertrag" einfuegen
- Wird zwischen den persoenlichen Informationen und den Statistiken platziert
- Card mit `FileDown`-Icon im Header (bereits importiert)
- Zeigt den Vertragsstatus an ("Unterzeichnet")
- Enthaelt einen Button "Vertrag herunterladen", der die `signed_contract_pdf_url` in einem neuen Tab oeffnet
- Wird nur angezeigt, wenn `contract?.signed_contract_pdf_url` vorhanden ist

### Technische Details
- Nur eine Datei betroffen: `src/pages/mitarbeiter/MeineDaten.tsx`
- Keine neuen Imports noetig (`FileDown` ist bereits importiert)
- Keine Datenbank- oder Schema-Aenderungen erforderlich
