

# Bewerbungen-Reiter und Brandings-ID-Anzeige

## 1. Datenbank: Neue Tabelle `applications`

SQL-Migration erstellt folgende Tabelle:

| Spalte | Typ | Beschreibung |
|---|---|---|
| id | uuid (PK) | Automatisch generiert |
| first_name | text (NOT NULL) | Vorname |
| last_name | text (NOT NULL) | Nachname |
| email | text (NOT NULL) | E-Mail |
| phone | text | Telefonnummer |
| street | text | Strasse und Hausnummer |
| zip_code | text | PLZ |
| city | text | Stadt |
| employment_type | text (NOT NULL) | "minijob", "teilzeit" oder "vollzeit" |
| branding_id | uuid (FK, nullable) | Zuordnung zu einem Branding |
| created_at | timestamptz | Erstellungszeitpunkt |

- RLS-Policies: Nur Admins duerfen lesen, erstellen, bearbeiten und loeschen (via `has_role()`)
- Foreign Key auf `brandings.id` mit `ON DELETE SET NULL`

## 2. Brandings-Tabelle: ID-Spalte hinzufuegen

In `AdminBrandings.tsx` wird eine neue Spalte "ID" in die Tabelle eingefuegt. Die ID wird gekuerzt angezeigt (erste 8 Zeichen) mit einem Kopier-Button daneben, der die volle UUID in die Zwischenablage kopiert und eine Erfolgsmeldung zeigt.

## 3. Sidebar-Update

Neuer Eintrag in `AdminSidebar.tsx`:
- Icon: `FileText`
- Titel: "Bewerbungen"
- URL: `/admin/bewerbungen`

## 4. Neue Seite: `AdminBewerbungen.tsx`

Folgt dem gleichen Aufbau wie `AdminBrandings.tsx`:

### Tabellenansicht
- Spalten: Name (Vor- + Nachname), E-Mail, Telefon, Ort (PLZ + Stadt), Anstellungsart (als Badge), Branding (Firmenname), Eingegangen am, Loeschen-Button

### Dialog "Bewerbung hinzufuegen"
- Vorname und Nachname (nebeneinander)
- E-Mail und Telefon (nebeneinander)
- Strasse, PLZ, Stadt
- Anstellungsart als Select-Dropdown (Minijob, Teilzeit, Vollzeit)
- Branding als Select-Dropdown (laedt alle Brandings aus der DB, zeigt Firmennamen)
- Validierung mit Zod (Vorname, Nachname, E-Mail, Anstellungsart als Pflichtfelder)

## 5. Routing

Neue Route in `App.tsx`:
```
<Route path="bewerbungen" element={<AdminBewerbungen />} />
```

---

## Technische Details

### Neue Dateien

| Datei | Zweck |
|---|---|
| `src/pages/admin/AdminBewerbungen.tsx` | Bewerbungen-Tabelle + Hinzufuegen-Dialog |

### Geaenderte Dateien

| Datei | Aenderung |
|---|---|
| `src/components/admin/AdminSidebar.tsx` | Neuer Nav-Eintrag "Bewerbungen" |
| `src/App.tsx` | Neue Route `/admin/bewerbungen` |
| `src/pages/admin/AdminBrandings.tsx` | ID-Spalte mit Kopier-Button in der Tabelle |

### SQL-Migration

- Tabelle `applications` erstellen mit FK auf `brandings` und RLS (nur Admins)

### Keine neuen Abhaengigkeiten

Alles mit vorhandenen Libraries (Shadcn Select, Table, Dialog, React Query, Zod, Lucide Icons).
