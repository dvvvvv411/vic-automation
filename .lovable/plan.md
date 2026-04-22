

## Plan: Auftrag-zuweisen-Popup auf /admin/mitarbeiter dynamisch breit

### Ziel
Das „Auftrag zuweisen"-Popup (Komponente `AssignmentDialog` im Modus `contract`) soll sich automatisch an den längsten Text im Inhalt anpassen, statt auf die fixe `max-w-md`-Breite begrenzt zu sein. Lange Auftragstitel/Anbieter-Namen werden so nicht mehr abgeschnitten.

### Umsetzung

**Datei:** `src/components/admin/AssignmentDialog.tsx`

1. Im `<DialogContent>` die fixe Breite `max-w-md` ersetzen durch eine **inhaltsbasierte Breite**:
   - `w-fit` (Breite passt sich dem Inhalt an)
   - `max-w-[95vw]` (verhindert Overflow auf kleinen Viewports)
   - `min-w-[28rem]` (sinnvolle Mindestbreite, damit das Popup nicht zu schmal wirkt, wenn nur kurze Einträge existieren)
2. Bei den Auftragszeilen (`renderRow`) das `truncate` auf `item.label` und `item.sublabel` entfernen bzw. durch `whitespace-nowrap` ersetzen, damit der Text nicht gekürzt wird und die Dialog-Breite tatsächlich vom längsten Eintrag bestimmt wird.
3. Search-Input und Footer bleiben dadurch automatisch passend breit (sie strecken sich auf 100 % des Containers).

### Was NICHT geändert wird
- Keine Änderung an Tabs, Selection-Logik, Mutation, Footer-Texten
- Mode `order` (auf `/admin/auftraege`) wird durch dieselbe Komponente automatisch mit-aktualisiert — gewünschtes Verhalten, da auch dort lange Mitarbeiter-Namen vorkommen können
- Keine Änderung an `dialog.tsx` selbst

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/components/admin/AssignmentDialog.tsx` | `DialogContent`-Klassen auf `w-fit min-w-[28rem] max-w-[95vw]`; `truncate` in Zeilen entfernen |

### Erwartetes Ergebnis
Das Popup ist genau so breit wie der längste Auftrags-/Mitarbeiter-Eintrag — keine abgeschnittenen Titel mehr, aber auch keine unnötig riesige Breite bei kurzen Einträgen.

