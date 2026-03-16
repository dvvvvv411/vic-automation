

## Plan: Wartende Idents als eigene Sektion + Stat-Card entfernen

### 1. Stat-Card "Wartende Idents" entfernen

**Datei:** `src/pages/admin/AdminDashboard.tsx`

- Die 6. Stat-Card ("Wartende Idents") aus dem `stats`-Array entfernen (Zeile 139)
- Den zugehoerigen Query `waitingIdentCount` / `l6` entfernen (Zeilen 83-91)
- `Video` aus den Imports entfernen
- `STAT_BORDERS` wieder auf 5 Eintraege kuerzen (6. Eintrag entfernen)
- Grid zurueck auf `xl:grid-cols-5`

### 2. Neue Komponente "Wartende Idents" erstellen

**Neue Datei:** `src/components/admin/WaitingIdents.tsx`

Analog zu `UpcomingTrialDays.tsx`:
- Query: `ident_sessions` mit `status` in `('waiting', 'data_sent')`, gefiltert nach `branding_id = activeBrandingId`
- Join auf `employment_contracts(first_name, last_name)` ueber `contract_id`
- Icon: `Video`, Titel: "Wartende Ident-Sessions"
- Grid-Layout mit kleinen Cards: Name, Status-Badge (`waiting` = "Wartet", `data_sent` = "Daten gesendet"), Erstelldatum
- **Klick auf Card:** `navigate(\`/admin/idents/${item.id}\`)` – navigiert direkt zur Ident-Detail-Seite des Users
- Status-Styles: `waiting` (amber), `data_sent` (blue)

### 3. Dashboard einbinden

**Datei:** `src/pages/admin/AdminDashboard.tsx`

- Import `WaitingIdents`
- Rendern unterhalb von `<UpcomingTrialDays />`: `<WaitingIdents />`

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/admin/AdminDashboard.tsx` | 6. Stat-Card + Query entfernen, Grid auf 5 Spalten, WaitingIdents importieren/rendern |
| `src/components/admin/WaitingIdents.tsx` | Neue Komponente mit klickbaren Cards |

