## Ziel
Beim Mass-Import (Indeed, Extern Allgemein, Extern Meta) automatisch Duplikate anhand der E-Mail-Adresse erkennen, visuell anzeigen und beim Import auslassen.

## Änderungen in `src/pages/admin/AdminBewerbungen.tsx`

### 1) Duplikat-Erkennung (live, während Eingabe)
- `useMemo` auf `massImportText` (nur aktiv wenn `isMassImport`):
  - Pro Zeile `parseMassImportLine` ausführen, gültige Einträge sammeln.
  - Vergleich gegen `applications` (bereits per Query geladen, gefiltert nach `activeBrandingId`) anhand `email.toLowerCase().trim()`.
  - Zusätzlich Duplikate **innerhalb** des Textes erkennen (gleiche E-Mail mehrfach eingegeben → nur erstes Vorkommen behalten).
  - Ergebnis: `{ parsed, duplicates: ParsedApplicant[], uniqueToImport: ParsedApplicant[] }`.

### 2) Visuelle Anzeige unterhalb der Textarea
- Wenn `duplicates.length > 0`: gelber Hinweis-Block (Card mit `border-yellow-500 bg-yellow-50`) mit:
  - Headline: "X Duplikate erkannt (werden beim Import übersprungen)"
  - Liste: `Vorname Nachname – email` pro Duplikat.
- Zähler-Zeile: "Y neue Bewerbungen werden importiert · X Duplikate übersprungen".

### 3) Import-Logik anpassen (ca. Zeile 654–680)
- Statt `parsed` → `uniqueToImport` an `massImportMutation.mutate(...)` übergeben.
- Wenn `uniqueToImport.length === 0`: Toast "Keine neuen Bewerbungen – alle Einträge sind Duplikate", kein Import.
- Success-Toast erweitern: "X importiert, Y Duplikate übersprungen" (nur wenn Duplikate > 0).

### 4) Reset
- Duplikat-State leert sich automatisch über `useMemo` beim Reset von `massImportText`.

## Nicht betroffen
- Einzel-Anlage-Formular, DB-Schema, Edge Functions, andere Seiten.
