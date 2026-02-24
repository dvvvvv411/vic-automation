

# Yvonnes Auftraege korrigieren und Admin-Buttons absichern

## Was ist passiert?

Bei Felix hat das Status-Update auf "in_pruefung" beim Absenden der Bewertung funktioniert. Bei Yvonne ist es still fehlgeschlagen (vermutlich ein Timing- oder RLS-Problem), und der Code hat den Fehler komplett ignoriert. Dadurch blieben Yvonnes Assignments auf "offen", und die Genehmigung konnte nicht richtig greifen.

## Aenderungen

### 1. SQL-Migration: Yvonnes Auftraege auf "erfolgreich" setzen

Die beiden bereits genehmigten Auftraege werden direkt auf "erfolgreich" gesetzt. Das Guthaben (95 EUR) ist bereits korrekt.

```sql
UPDATE order_assignments
SET status = 'erfolgreich'
WHERE contract_id = '892e6fda-0dbb-4ed5-a7b3-0b8b5315c2f8'
  AND order_id IN (
    'a4445b57-979a-4272-bf51-5affdf430f89',
    'c47dcf68-4220-41fe-95ea-8e38e597d85b'
  )
  AND status = 'offen';
```

### 2. Admin-Bewertungsseite: Buttons nicht nur bei "in_pruefung" anzeigen

**Datei: `src/pages/admin/AdminBewertungen.tsx`**

Die Genehmigen/Ablehnen-Buttons werden aktuell nur bei Status "in_pruefung" angezeigt. Das wird geaendert: Buttons erscheinen immer, solange der Status weder "erfolgreich" noch "fehlgeschlagen" ist. So funktioniert die Genehmigung auch wenn das Status-Update beim Absenden mal fehlschlagen sollte.

- **Zeile 319**: `g.assignment_status === "in_pruefung"` aendern zu `!["erfolgreich", "fehlgeschlagen"].includes(g.assignment_status)`
- **Zeile 375**: `selected?.assignment_status === "in_pruefung"` aendern zu `selected && !["erfolgreich", "fehlgeschlagen"].includes(selected.assignment_status)`

Keine neuen Dateien, keine neuen Abhaengigkeiten. Reviews bleiben unangetastet.

