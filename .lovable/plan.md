

# Bewertungssystem fuer App-Tests

## Uebersicht

Mitarbeiter koennen nach dem Testen einer App die Bewertungsfragen mit Sternen (0-5) und einem Pflichtkommentar beantworten. Admins sehen alle Bewertungen in einer Tabelle mit Durchschnittswerten und koennen Details in einem Popup einsehen.

## 1. Datenbank: Neue Tabelle `order_reviews`

Eine neue Tabelle speichert die einzelnen Bewertungen pro Frage:

| Spalte | Typ | Beschreibung |
|---|---|---|
| id | uuid (PK) | Auto-generiert |
| order_id | uuid (FK -> orders) | Zugehoeriger Auftrag |
| contract_id | uuid (FK -> employment_contracts) | Bewertender Mitarbeiter |
| question | text | Die Bewertungsfrage |
| rating | integer (0-5) | Sterne-Bewertung |
| comment | text | Pflichtkommentar |
| created_at | timestamptz | Zeitstempel |

RLS-Policies:
- Admins: SELECT (alle Bewertungen einsehen)
- Users: INSERT (eigene Bewertungen abgeben, nur fuer zugewiesene Auftraege)
- Users: SELECT (eigene Bewertungen lesen)

## 2. Auftragsdetails: Reihenfolge aendern + Button

In `AuftragDetails.tsx`:
- Downloads-Card **ueber** die Projektziel-Card verschieben
- In der Bewertungsfragen-Card einen Button "Bewertung starten" hinzufuegen, der zu `/mitarbeiter/bewertung/:orderId` navigiert
- Wenn bereits bewertet, Button deaktivieren mit Text "Bereits bewertet"

## 3. Neue Seite: `/mitarbeiter/bewertung/:id`

Moderne Bewertungsseite mit:

```text
┌──────────────────────────────────────────────┐
│ [<- Zurueck]     Bewertung: App-Titel        │
├──────────────────────────────────────────────┤
│                                              │
│  Frage 1/5: Wie war die Benutzeroberflaeche? │
│                                              │
│  [★] [★] [★] [★] [☆]    4/5 Sterne          │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ Dein Kommentar (Pflicht)...          │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  --- Separator ---                           │
│                                              │
│  Frage 2/5: Gab es technische Probleme?      │
│  ...                                         │
│                                              │
├──────────────────────────────────────────────┤
│            [Bewertung abschicken]             │
└──────────────────────────────────────────────┘
```

- Alle Fragen auf einer Seite mit Sterne-Auswahl (klickbare Sterne 0-5) und Textarea
- Validierung: Alle Fragen muessen mindestens 1 Stern und einen Kommentar haben
- Abschicken: Alle Antworten als Batch-Insert in `order_reviews`
- Nach erfolgreichem Absenden: Redirect zurueck zur Auftragsdetails-Seite mit Erfolgsmeldung

## 4. Admin: Neuer Reiter `/admin/bewertungen`

Tabelle mit folgenden Spalten:

| Mitarbeiter | Auftrag | Durchschnitt | Datum | Aktion |
|---|---|---|---|---|
| Max Mustermann | App-Test XY | 4.2 / 5 ★ | 15.02.2026 | [Details] |

- Daten werden ueber einen Join aus `order_reviews`, `employment_contracts` und `orders` geladen
- Gruppierung nach order_id + contract_id fuer die Durchschnittsberechnung
- **Details-Popup (Dialog)**: Zeigt alle Einzelbewertungen mit Frage, Sterne und Kommentar

## Aenderungen

| Datei | Aenderung |
|---|---|
| Migration | Neue Tabelle `order_reviews` mit RLS-Policies |
| `src/pages/mitarbeiter/AuftragDetails.tsx` | Downloads ueber Projektziel verschieben, "Bewertung starten"-Button hinzufuegen |
| `src/pages/mitarbeiter/Bewertung.tsx` | **Neue Datei** -- Bewertungsseite mit Sterne-Rating und Kommentaren |
| `src/pages/admin/AdminBewertungen.tsx` | **Neue Datei** -- Admin-Tabelle mit Bewertungsuebersicht und Detail-Dialog |
| `src/App.tsx` | Neue Routen: `bewertung/:id` (Mitarbeiter) und `bewertungen` (Admin) |
| `src/components/admin/AdminSidebar.tsx` | Neuer Nav-Eintrag "Bewertungen" mit Star-Icon |

