
# Neuer Admin-Reiter: Bewerbungen

## Uebersicht

Neue Seite `/admin/bewerbungen` mit Tabellenansicht aller Bewerbungen und einem Dialog zum manuellen Hinzufuegen. Folgt exakt dem bestehenden Muster von AdminBrandings.

---

## 1. Datenbank: Neue Tabelle `applications`

| Spalte | Typ | Beschreibung |
|---|---|---|
| id | uuid (PK) | Automatisch generiert |
| first_name | text | Vorname |
| last_name | text | Nachname |
| email | text | E-Mail |
| phone | text | Telefonnummer |
| street | text | Strasse und Hausnummer |
| zip_code | text | PLZ |
| city | text | Stadt |
| employment_type | text | "minijob", "teilzeit" oder "vollzeit" |
| branding_id | uuid (nullable, FK) | Optionale Zuordnung zu einem Branding (fuer spaetere API-Anbindung) |
| created_at | timestamptz | Erstellungszeitpunkt |

- RLS-Policies: Nur Admins duerfen lesen, erstellen, bearbeiten und loeschen (via `has_role()`)

---

## 2. Sidebar-Update

Neuer Eintrag in `AdminSidebar.tsx`:
- Icon: `FileText` (aus lucide-react)
- Titel: "Bewerbungen"
- URL: `/admin/bewerbungen`

---

## 3. Neue Seite: `AdminBewerbungen.tsx`

Folgt dem gleichen Aufbau wie `AdminBrandings.tsx`:

### Tabellenansicht
- Spalten: Name, E-Mail, Telefon, Ort, Anstellungsart, Eingegangen am
- Daten via `@tanstack/react-query` aus `applications`
- Leerer Zustand mit Hinweis

### Dialog "Bewerbung hinzufuegen"
- Formular mit allen Feldern
- Anstellungsart als Select/Dropdown (Minijob, Teilzeit, Vollzeit)
- Validierung mit Zod (Name, E-Mail Pflicht)
- Loeschen-Button pro Zeile

---

## 4. Routing

Neue Route in `App.tsx` als Kind von `/admin`:
```
<Route path="bewerbungen" element={<AdminBewerbungen />} />
```

---

## Technische Details

### Neue Dateien

| Datei | Zweck |
|---|---|
| `src/pages/admin/AdminBewerbungen.tsx` | Bewerbungen-Tabellenansicht + Hinzufuegen-Dialog |

### Geaenderte Dateien

| Datei | Aenderung |
|---|---|
| `src/components/admin/AdminSidebar.tsx` | Neuer Nav-Eintrag "Bewerbungen" |
| `src/App.tsx` | Neue Route `/admin/bewerbungen` |

### SQL-Migration

Tabelle `applications` erstellen mit RLS (nur Admins)
