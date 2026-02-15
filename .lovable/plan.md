
# Aenderungen: Praemie-Symbol, Bewertungsfragen, Bewertungsfreigabe, Button-Text

## Uebersicht

Vier Aenderungen werden umgesetzt:
1. Euro-Zeichen bei Praemien auf allen Auftrags-Cards
2. Bewertungsfragen auch bei Nicht-Platzhalter-Auftraegen anzeigen
3. Admin kann Bewertung bei Auftragsterminen freigeben -- erst danach kann der Mitarbeiter bewerten
4. Button-Text "Auftrag ansehen" statt "Auftrag starten" bei gebuchtem Termin

---

## 1. Euro-Zeichen bei Praemien

**Dateien**: `MitarbeiterAuftraege.tsx`, `MitarbeiterDashboard.tsx`, `AuftragDetails.tsx`

Aktuell wird `{order.reward}` direkt angezeigt (z.B. "50"). Aenderung: `{order.reward} €` -- ein Euro-Zeichen wird angehaengt, sofern nicht bereits eines enthalten ist.

Betroffene Stellen:
- `MitarbeiterAuftraege.tsx` Zeile ca. 186: Praemie-Anzeige auf der Card
- `MitarbeiterDashboard.tsx` Zeile ca. 320: Praemie-Anzeige auf der Card
- `AuftragDetails.tsx` Zeile ca. 254: Praemie in der Detail-Ansicht

---

## 2. Bewertungsfragen auch bei Nicht-Platzhalter-Auftraegen

**Datei**: `AuftragDetails.tsx`

Aktuell (Zeile 438-473): Bewertungsfragen werden nur angezeigt wenn `order.is_placeholder === true`. Die Bedingung wird geaendert, sodass Fragen immer angezeigt werden wenn vorhanden.

Fuer Nicht-Platzhalter-Auftraege wird der "Bewertung starten"-Button aber nur angezeigt wenn die Bewertung freigeschaltet ist (siehe Punkt 3). Ohne Freischaltung werden die Fragen als reine Info-Liste dargestellt mit einem Hinweis "Die Bewertung wird nach Freigabe durch den Admin freigeschaltet."

---

## 3. Bewertungsfreigabe durch Admin bei Auftragsterminen

### 3a. Neue Spalte in `order_assignments`: `review_unlocked`

**Migration**: Neue boolesche Spalte `review_unlocked` (default `false`) auf `order_assignments`. Bei Platzhalter-Auftraegen wird dieses Feld nicht beachtet -- dort funktioniert alles wie bisher.

```sql
ALTER TABLE order_assignments ADD COLUMN review_unlocked boolean NOT NULL DEFAULT false;
```

### 3b. Admin-Auftragstermine: Freigabe-Button

**Datei**: `AdminAuftragstermine.tsx`

- Zusaetzlich wird `order_assignments` geladen (status + review_unlocked) fuer jedes Appointment
- Neue Spalte "Aktion" in der Tabelle
- Button "Bewertung freigeben" wenn `review_unlocked = false`
- Badge "Freigegeben" wenn `review_unlocked = true`
- Klick auf Button setzt `review_unlocked = true` fuer die entsprechende `order_id` + `contract_id` Kombination in `order_assignments`

### 3c. Mitarbeiter: Bewertungs-Button nur wenn freigeschaltet

**Datei**: `AuftragDetails.tsx`

- `review_unlocked` wird aus `order_assignments` mitgeladen (wird bereits geladen, Feld muss ergaenzt werden)
- Bei Nicht-Platzhalter-Auftraegen:
  - Wenn `review_unlocked = false`: Bewertungsfragen werden als Info angezeigt + Hinweistext "Bewertung wird nach Freigabe durch Ihren Ansprechpartner freigeschaltet."
  - Wenn `review_unlocked = true`: "Bewertung starten"-Button wird angezeigt (gleich wie bei Platzhaltern)
- Bei Platzhalter-Auftraegen: Keine Aenderung, alles wie bisher

### 3d. Praemien-Gutschrift nur bei Genehmigung

Dies funktioniert bereits korrekt: In `AdminBewertungen.tsx` wird die Praemie nur gutgeschrieben wenn der Admin auf "Genehmigen" klickt (Zeile 119-157). Keine Aenderung noetig.

---

## 4. Button-Text: "Auftrag ansehen" bei gebuchtem Termin

**Dateien**: `MitarbeiterDashboard.tsx`, `MitarbeiterAuftraege.tsx`

In beiden `StatusButton`-Komponenten im `default`-Case: Wenn `!isPlaceholder && hasAppointment`, wird der Text von "Auftrag starten" auf "Auftrag ansehen" geaendert und das Icon wird angepasst (z.B. `ExternalLink` durch `Eye` ersetzt).

---

## Technische Zusammenfassung

| Datei | Aenderung |
|---|---|
| Migration (neu) | `review_unlocked` boolean auf `order_assignments` |
| `MitarbeiterAuftraege.tsx` | Euro-Zeichen, Button "Auftrag ansehen" |
| `MitarbeiterDashboard.tsx` | Euro-Zeichen, Button "Auftrag ansehen" |
| `AuftragDetails.tsx` | Euro-Zeichen, Bewertungsfragen fuer alle Auftraege, Freischaltlogik |
| `AdminAuftragstermine.tsx` | Freigabe-Button-Spalte, Assignment-Daten laden |
| `types.ts` | `review_unlocked` Feld in Types ergaenzen |
