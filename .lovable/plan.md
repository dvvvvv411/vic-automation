

## Plan: Telefonnummer-Normalisierung für Spoof-SMS

### Problem
Zeile 268: `selectedEmployee.phone.replace(/[^0-9]/g, "")` entfernt nur Nicht-Ziffern, wandelt aber `0176...` nicht in `49176...` um.

### Lösung
Eine Normalisierungsfunktion einbauen, die nach dem Entfernen von Nicht-Ziffern prüft ob die Nummer mit `0` beginnt und das durch `49` ersetzt. Wird an beiden Stellen angewendet (Template-Versand Zeile 268 und manueller Versand Zeile 177).

### Änderung in `src/pages/admin/AdminSmsSpoof.tsx`

1. **Hilfsfunktion** oben in der Komponente:
```typescript
const normalizeTo49 = (phone: string): string => {
  let digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) digits = "49" + digits.slice(1);
  if (!digits.startsWith("49")) digits = "49" + digits;
  return digits;
};
```

2. **Zeile 268** (Template-Versand): `to: selectedEmployee.phone.replace(/[^0-9]/g, "")` → `to: normalizeTo49(selectedEmployee.phone)`

3. **Zeile 177** (manueller Versand): `to: to.trim()` — hier auch `normalizeTo49()` anwenden, falls der User `0176...` eingibt

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminSmsSpoof.tsx` | Normalisierungsfunktion + 2 Stellen anpassen |

