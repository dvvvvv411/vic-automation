

# Bewertungsstatus + Genehmigen/Ablehnen auf Mitarbeiter-Detailseite

## Aktueller Zustand
Die Bewertungen-Sektion zeigt nur Sterne und Kommentare pro Auftrag (Collapsible), aber keinen Bewertungsstatus und keine Genehmigen/Ablehnen-Buttons.

## Änderungen in `src/pages/admin/AdminMitarbeiterDetail.tsx`

### 1. Status-Badge pro Bewertungsgruppe anzeigen
- Den `assignment_status` aus `assignments` für jeden Auftrag im Bewertungsbereich anzeigen (gleiche Badges wie in der Auftrags-Tabelle: "In Prüfung", "Erfolgreich", "Fehlgeschlagen", "Offen")
- Dazu beim Rendern der `reviewsByOrder`-Gruppen den passenden Assignment-Status aus `assignments` nachschlagen

### 2. Genehmigen/Ablehnen-Buttons pro Bewertungsgruppe
- Für Bewertungen mit Status ≠ "erfolgreich" und ≠ "fehlgeschlagen": CheckCircle (Genehmigen) und XCircle (Ablehnen) Buttons in der CollapsibleTrigger-Zeile anzeigen
- **Genehmigen**: gleiche Logik wie `AdminBewertungen.tsx` — Status auf "erfolgreich" setzen, Prämie gutschreiben, E-Mail + SMS senden
- **Ablehnen**: Status auf "fehlgeschlagen", Reviews löschen, E-Mail + SMS senden
- Processing-State um doppelte Klicks zu verhindern
- Nach Aktion: queries invalidieren (`admin-contract-detail`, `admin-contract-assignments`, `admin-contract-reviews`)

### 3. Imports hinzufügen
- `XCircle` von lucide-react
- `sendEmail` und `sendSms` aus den lib-Dateien

