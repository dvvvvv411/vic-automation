

## Plan: Verlauf-Card auf 5 Einträge mit Scrollbar begrenzen

### Änderung

**Datei: `src/pages/admin/AdminSmsSpoof.tsx`**, Zeile 400

Die `CardContent` bekommt eine feste max-Höhe, sodass ca. 5 SMS-Einträge sichtbar sind und der Rest per ScrollArea scrollbar wird.

- `ScrollArea` aus `@/components/ui/scroll-area` importieren
- Die Table in eine `ScrollArea` mit `className="max-h-[320px]"` wrappen (5 Zeilen × ~64px)
- Die bestehende `overflow-auto` Klasse auf `CardContent` entfernen, da ScrollArea das übernimmt

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminSmsSpoof.tsx` | ScrollArea um die Verlauf-Tabelle, max-Höhe begrenzen |

