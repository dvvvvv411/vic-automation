

## Plan: Download-Links und Info-Notes im Videident-Step anzeigen

### Problem 1: info_notes wird nie angezeigt
Das `IdentSession` Interface (Zeile 60-68) enthält kein `info_notes` Feld. Beim Setzen des State (Zeile 158-166) wird `info_notes` nicht übernommen, obwohl es per `select("*")` geladen wird. Das Rendering bei Zeile 889 greift auf `(identSession as any)?.info_notes` zu, was immer `undefined` ist.

### Problem 2: Download-Links fehlen im Videident-Step
Die App Store / Play Store Buttons werden nur im "preparation" Step angezeigt (Zeile 584), nicht im "videident" Step wo der Mitarbeiter die Test-Daten sieht und den Video-Chat durchführt.

### Lösung

**Datei: `src/pages/mitarbeiter/AuftragDetails.tsx`**

1. **`info_notes` zum IdentSession Interface hinzufügen** (Zeile 60-68):
   - Neues Feld: `info_notes: string | null`

2. **`info_notes` beim State-Setzen übernehmen** (3 Stellen: Zeile 158, 207, 321):
   - `info_notes: session.info_notes ?? null` zu allen `setIdentSession` Aufrufen hinzufügen

3. **`(identSession as any)` Casts entfernen** (Zeile 889, 895):
   - Direkt `identSession?.info_notes` verwenden

4. **info_notes auch anzeigen wenn KEINE Test-Daten vorhanden** (Zeile 842-877):
   - Im "Warte auf Test-Daten" Block (hasTestData === false) ebenfalls info_notes anzeigen, falls vorhanden

5. **Download-Links im Videident-Step hinzufügen** (nach Zeile 727, vor dem Grid):
   - App Store / Play Store Badges wie im Preparation-Step einfügen, wenn `order.appstore_url` oder `order.playstore_url` vorhanden

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/mitarbeiter/AuftragDetails.tsx` | IdentSession Interface erweitern, info_notes in State übernehmen, Download-Links im Videident-Step, info_notes auch ohne Test-Daten anzeigen |

