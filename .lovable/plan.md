

# Neuer Reiter "Bewertungen" im Mitarbeiter-Panel

## Uebersicht

Ein neuer Sidebar-Eintrag "Bewertungen" wird hinzugefuegt, der zu `/mitarbeiter/bewertungen` fuehrt. Dort sieht der Mitarbeiter alle seine abgegebenen Bewertungen in einer uebersichtlichen Card-Ansicht -- gruppiert nach Auftrag.

## Aenderungen

### 1. Sidebar-Eintrag (`src/components/mitarbeiter/MitarbeiterSidebar.tsx`)
- Neuer Nav-Eintrag "Bewertungen" mit `Star`-Icon, Ziel: `/mitarbeiter/bewertungen`

### 2. Neue Seite (`src/pages/mitarbeiter/MitarbeiterBewertungen.tsx`)
- Laedt alle `order_reviews` des Mitarbeiters (ueber `contract_id`) mit zugehoeriger Order-Info (Titel, Auftragsnummer)
- Gruppiert nach Auftrag: Pro Auftrag eine Card mit dem Titel als Header
- Innerhalb jeder Card: Alle Fragen mit Sternebewertung (nur Anzeige, nicht editierbar) und Kommentar
- Erstellungsdatum der Bewertung wird angezeigt
- Gleicher Card-Stil wie die Auftraege-Seite (border-border/60, shadow-sm, Gradient-Stripe)
- Framer-Motion Animationen
- Leerer Zustand wenn noch keine Bewertungen abgegeben wurden

### 3. Routing (`src/App.tsx`)
- Neue Child-Route `bewertungen` unter `/mitarbeiter` mit `MitarbeiterBewertungen`-Komponente

## Datenquelle

```text
SELECT or.question, or.rating, or.comment, or.created_at, o.title, o.order_number
FROM order_reviews or
JOIN orders o ON o.id = or.order_id
WHERE or.contract_id = :contractId
ORDER BY or.created_at DESC
```

RLS ist bereits konfiguriert: "Users can select own order_reviews" erlaubt Mitarbeitern das Lesen ihrer eigenen Bewertungen.

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/components/mitarbeiter/MitarbeiterSidebar.tsx` | Neuer Nav-Eintrag "Bewertungen" mit Star-Icon |
| `src/pages/mitarbeiter/MitarbeiterBewertungen.tsx` | **Neue Datei** -- Bewertungsuebersicht gruppiert nach Auftrag |
| `src/App.tsx` | Neue Route `bewertungen` als Child von `/mitarbeiter` |

