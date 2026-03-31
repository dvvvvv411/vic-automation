

## Plan: AssignmentDialog Fix + betroffene Aufträge reparieren

### Was kaputt ist

`AssignmentDialog.tsx` Zeile 129-144: Beim Speichern wird **alles gelöscht** und **neu eingefügt** — ohne Status. Die DB setzt dann den Default `offen`. Jeder Klick auf "Zuweisen > Speichern" setzt alle Mitarbeiter-Status zurück.

### Betroffene Datensätze

15 Zuweisungen stehen aktuell auf `offen`, obwohl sie Reviews oder Anhänge haben (= waren definitiv weiter als "offen"):

| Mitarbeiter | Auftrag |
|---|---|
| Felix Ledwon | Coinfinity |
| Yvonne Reiter | Coinfinity |
| Vildan Özmen | Coinfinity |
| Tanja Gädtke | Bewertung ASX Onlineshop |
| Traude Eggert | Bewertung ASX Onlineshop |
| Kevin Vongries | Bewertung ASX Onlineshop |
| Manuela Ganske | Bewertung ASX Onlineshop |
| Simon Alebachew | Bewertung ASX Onlineshop |
| Bernhard Garritzmann | Bewertung ASX Onlineshop |
| Traude Eggert | Bewertung Engelhorn Onlineshop |
| Kevin Vongries | Bewertung Engelhorn Onlineshop |
| Tanja Gädtke | Bewertung Engelhorn Onlineshop |
| Manuela Ganske | Bewertung Engelhorn Onlineshop |
| Simon Alebachew | Bewertung Engelhorn Onlineshop |
| Bernhard Garritzmann | Bewertung Engelhorn Onlineshop |

### Fix 1: AssignmentDialog — diff-basiertes Update

**Datei:** `src/components/admin/AssignmentDialog.tsx`

Die `saveMutation` wird umgebaut:

```text
existingIds = IDs die vorher zugewiesen waren
selected    = IDs die jetzt ausgewählt sind

toRemove = existingIds - selected  → nur diese DELETE
toAdd    = selected - existingIds  → nur diese INSERT

Alles andere wird NICHT angefasst → Status bleibt erhalten
```

### Fix 2: Betroffene Zuweisungen auf `erfolgreich` setzen

**SQL-Migration** die alle 15 betroffenen Zuweisungen prüft und korrekt setzt:

- Hat Reviews UND alle Anhänge genehmigt → `erfolgreich`
- Hat Reviews aber Anhänge noch offen → `in_pruefung`
- Sicherheitshalber nur Zuweisungen mit Status `offen` die nachweislich Reviews haben

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/components/admin/AssignmentDialog.tsx` | saveMutation: diff-basiert statt delete-all |
| Neue SQL-Migration | Betroffene 15 Zuweisungen Status korrigieren |

