

## Plan: Verlauf-Card Scrollbar richtig implementieren

### Problem
Die `ScrollArea` mit `max-h-[320px]` funktioniert nicht, weil Radix ScrollArea die Höhenbegrenzung auf dem Root-Element braucht und eine feste Höhe (`h-[320px]`) statt `max-h` benötigt. Außerdem ist ein überflüssiges `div.premium-card` dazwischen, das die Scroll-Logik stört.

### Lösung

**Datei: `src/pages/admin/AdminSmsSpoof.tsx`**, Zeilen 412-442

- `ScrollArea` bekommt `className="h-[320px]"` statt `max-h-[320px]`
- Das überflüssige `<div className="premium-card overflow-hidden">` Wrapper entfernen — die Table direkt in die ScrollArea
- Damit werden ca. 5 Einträge sichtbar und der Rest ist scrollbar

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminSmsSpoof.tsx` | ScrollArea Höhe fixen, überflüssigen Wrapper entfernen |

