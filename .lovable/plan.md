
## Plan: Arbeitsstunden im Mitarbeiter-Zuweisen-Popup wirklich sichtbar machen

### Ursache

Der bisherige Code in `src/components/admin/AssignmentDialog.tsx` ist zwar vorhanden, greift aber nicht für die echten Daten.

Aktuell wird so geprüft:
- `item.employmentType === "Minijob"`
- `item.employmentType === "Teilzeit"`
- `item.employmentType === "Vollzeit"`

Die geladenen Werte aus `employment_contracts.employment_type` kommen aber tatsächlich klein zurück, z. B.:
- `minijob`
- `teilzeit`

Dadurch wird nur die Anstellungsart angezeigt, aber die Stunden-Mappings feuern nie.

### Fix

**Datei:** `src/components/admin/AssignmentDialog.tsx`

1. Die Anzeige der Anstellungsart zentral normalisieren:
   - `minijob` → `Minijob`
   - `teilzeit` → `Teilzeit`
   - `vollzeit` → `Vollzeit`

2. Die Stunden nicht mehr direkt über die bisherigen Case-sensitive Vergleiche rendern, sondern über ein robustes Mapping auf Basis des normalisierten/lowercase Werts.

Beispiel-Logik:
```ts
const employmentMeta: Record<string, { label: string; hours: string }> = {
  minijob: { label: "Minijob", hours: "10h/Woche" },
  teilzeit: { label: "Teilzeit", hours: "20h/Woche" },
  vollzeit: { label: "Vollzeit", hours: "40h/Woche" },
};
```

Dann im Popup:
- `Minijob · 10h/Woche`
- `Teilzeit · 20h/Woche`
- `Vollzeit · 40h/Woche`

3. Fallback für unbekannte Werte:
   - Falls mal ein anderer Wert gespeichert ist, trotzdem die Anstellungsart anzeigen statt leerer Stundenanzeige.

### Technische Details

Betroffener Bereich:
- Rendering-Zeile im Mitarbeiter-Eintrag innerhalb des Dialogs
- aktuell ungefähr der Block mit:
```tsx
{item.employmentType === "Minijob" && " · 10h/Woche"}
```

Dieser Block wird ersetzt durch:
- vorherige Normalisierung (`toLowerCase().trim()`)
- Mapping für Label + Stunden
- gemeinsame Ausgabe in einem String

### Erwartetes Ergebnis

Im Popup unter `/admin/auftraege` bei „Mitarbeiter zuweisen“ steht dann z. B. wirklich sichtbar:
- `teilzeit@example.de · Teilzeit · 20h/Woche`
- `max@example.de · Minijob · 10h/Woche`

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/components/admin/AssignmentDialog.tsx` | employment_type normalisieren und Stundenanzeige robust gegen lowercase DB-Werte machen |
