
# Admin Panel mit Sidebar und Brandings-Verwaltung

## Uebersicht

Das Admin Panel wird zu einem vollwertigen Layout mit Sidebar-Navigation und Sub-Routen umgebaut. Der erste Reiter "Brandings" erhaelt eine Tabellenansicht aller Brandings sowie ein Dialog-Formular zum Hinzufuegen neuer Brandings. Daten werden in einer neuen Supabase-Tabelle `brandings` gespeichert.

---

## 1. Datenbank: Neue Tabelle `brandings`

SQL-Migration erstellt die Tabelle mit folgenden Spalten:

| Spalte | Typ | Beschreibung |
|---|---|---|
| id | uuid (PK) | Automatisch generiert |
| logo_url | text | URL zum Logo (Supabase Storage) |
| company_name | text | Unternehmensname |
| street | text | Strasse und Hausnummer |
| zip_code | text | PLZ |
| city | text | Stadt |
| trade_register | text | z.B. "HRB 16675" |
| register_court | text | z.B. "Amtsgericht Regensburg" |
| managing_director | text | Geschaeftsfuehrer |
| vat_id | text | Umsatzsteuer-ID |
| domain | text | Domain |
| email | text | E-Mail |
| brand_color | text | Hex-Code der Brandingfarbe |
| created_at | timestamptz | Erstellungszeitpunkt |

RLS-Policies: Nur Admins (via `has_role()`) duerfen lesen, erstellen, bearbeiten und loeschen.

Ein **Storage Bucket** `branding-logos` wird fuer Logo-Uploads erstellt.

---

## 2. Admin Layout mit Sidebar

Das bisherige `Admin.tsx` wird zu einem **Layout-Wrapper** `AdminLayout.tsx` umgebaut:

```text
+--------+------------------------------------------+
| SIDEBAR|  HEADER (Vic Admin + User + Logout)       |
|        +------------------------------------------+
| Logo   |                                          |
|        |  CONTENT (Outlet fuer Sub-Routen)         |
| ----   |                                          |
| Ueber- |                                          |
| sicht  |                                          |
| Brand- |                                          |
| ings   |                                          |
|        |                                          |
| ----   |                                          |
| User   |                                          |
| Logout |                                          |
+--------+------------------------------------------+
```

- Verwendet die bestehende Shadcn Sidebar-Komponente
- Sidebar-Items: "Uebersicht" (`/admin`), "Brandings" (`/admin/brandings`)
- Aktiver Link wird hervorgehoben via NavLink
- Header bleibt oben mit User-Info und Logout

---

## 3. Routing-Aenderungen (App.tsx)

Nested Routes unter `/admin`:

- `/admin` -- Dashboard-Uebersicht (bisheriger Inhalt)
- `/admin/brandings` -- Brandings-Tabellenansicht

Alle Admin-Sub-Routen sind weiterhin durch `ProtectedRoute` mit `allowedRole="admin"` geschuetzt.

---

## 4. Brandings-Seite (`/admin/brandings`)

### Tabellenansicht
- Tabelle mit Spalten: Logo (Vorschau), Unternehmensname, Domain, Brandingfarbe (als farbiger Punkt), Erstellt am, Aktionen
- Laedt Daten via `@tanstack/react-query` aus der `brandings`-Tabelle
- Leerer Zustand mit Hinweis und Button zum Hinzufuegen

### Dialog "Branding hinzufuegen"
- Oeffnet sich ueber einen Button oben rechts
- Formular mit allen Feldern (siehe Tabelle oben)
- **Logo-Upload**: Datei-Input, Upload in Supabase Storage Bucket `branding-logos`, URL wird in der DB gespeichert
- **Farbauswahl**: Hex-Input-Feld kombiniert mit einem nativen `<input type="color" />` als visueller Picker
- Validierung mit Zod (Pflichtfelder, E-Mail-Format, Hex-Farbe)
- Nach Speichern: Query wird invalidiert, Tabelle aktualisiert sich

---

## Technische Details

### Neue Dateien

| Datei | Zweck |
|---|---|
| `src/components/admin/AdminLayout.tsx` | Layout mit Sidebar, Header, Outlet |
| `src/components/admin/AdminSidebar.tsx` | Sidebar-Komponente mit Navigation |
| `src/pages/admin/AdminDashboard.tsx` | Bisheriger Dashboard-Inhalt (Statistik-Cards) |
| `src/pages/admin/AdminBrandings.tsx` | Brandings-Tabellenansicht + Hinzufuegen-Dialog |

### Geaenderte Dateien

| Datei | Aenderung |
|---|---|
| `src/App.tsx` | Nested Routes fuer `/admin/*` mit Layout |
| `src/integrations/supabase/types.ts` | Neue Tabelle `brandings` in den Typen |

### SQL-Migration

1. Tabelle `brandings` erstellen mit RLS (nur Admins)
2. Storage Bucket `branding-logos` erstellen

### Keine neuen Abhaengigkeiten

Alles wird mit vorhandenen Libraries umgesetzt (Shadcn Sidebar, Table, Dialog, Form, React Query, Zod, Lucide Icons).
