

# Neuer Admin-Reiter: Auftraege

## Uebersicht

Ein neuer Bereich `/admin/auftraege` wird erstellt, in dem der Admin Auftraege fuer App-Tests verwalten kann (CRUD). Bei Platzhalter-Auftraegen erscheinen zusaetzlich AppStore- und PlayStore-Link-Felder.

## 1. Datenbank

### Neue Tabelle: `orders`

| Spalte | Typ | Pflicht | Default |
|---|---|---|---|
| id | uuid | ja | gen_random_uuid() |
| order_number | text | ja | - |
| title | text | ja | - |
| provider | text | ja | - |
| reward | text | ja | - |
| is_placeholder | boolean | ja | false |
| appstore_url | text | nein | null |
| playstore_url | text | nein | null |
| project_goal | text | nein | null |
| review_questions | jsonb | nein | '[]' |
| created_at | timestamptz | ja | now() |

RLS-Policies: Nur Admins duerfen SELECT, INSERT, UPDATE, DELETE (gleiches Muster wie bei `brandings`).

## 2. Neue Seite: `src/pages/admin/AdminAuftraege.tsx`

Folgt dem gleichen Pattern wie `AdminBrandings.tsx`:

### Tabelle
- Spalten: Auftragsnummer, Titel, Anbieter, Praemie, Platzhalter (Ja/Nein Badge), Erstellt am, Aktionen (Edit, Delete)

### Dialog zum Erstellen und Bearbeiten
- Felder: Auftragsnummer, Titel, Anbieter, Praemie (alle Pflicht)
- Platzhalter-Switch: Wenn aktiv, erscheinen zwei zusaetzliche Felder fuer AppStore-URL und PlayStore-URL. Wenn inaktiv, werden diese Felder ausgeblendet und die Werte auf null gesetzt.
- Projektziel: Textarea fuer detaillierte Anweisungen
- Bewertungsfragen: Dynamische Liste -- jede Frage ist ein Textfeld mit Loeschen-Button, plus ein "Frage hinzufuegen"-Button am Ende. Gespeichert als JSON-Array.
- Der Dialog wird sowohl fuer "Neu erstellen" als auch "Bearbeiten" verwendet (beim Bearbeiten werden die Felder mit den vorhandenen Daten befuellt).

### CRUD-Operationen
- **Create**: `.insert()` via useMutation
- **Read**: useQuery mit `.select("*").order("created_at", { ascending: false })`
- **Update**: Dialog oeffnet sich mit vorausgefuellten Daten, speichert via `.update().eq("id", ...)`
- **Delete**: Loeschen-Button in der Tabelle

## 3. Navigation und Routing

### `AdminSidebar.tsx`
- Neuer Eintrag "Auftraege" mit Icon `ClipboardList` und URL `/admin/auftraege` (zwischen Mitarbeiter und den bestehenden Eintraegen oder am Ende)

### `App.tsx`
- Neue Route: `<Route path="auftraege" element={<AdminAuftraege />} />`
- Import von `AdminAuftraege`

## Technische Details

| Datei | Aenderung |
|---|---|
| Migration | CREATE TABLE orders mit RLS-Policies (Admin-only) |
| `src/pages/admin/AdminAuftraege.tsx` | Neue Seite mit CRUD-Tabelle und Dialog |
| `src/components/admin/AdminSidebar.tsx` | Neuer Nav-Eintrag "Auftraege" mit ClipboardList-Icon |
| `src/App.tsx` | Neue Route + Import |

