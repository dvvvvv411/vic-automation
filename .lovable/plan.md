

## Plan: Footer-Hinweis „X neue Zuweisungen" im Mitarbeiter-zuweisen-Dialog

### Ziel
Im `/admin/auftraege` „Mitarbeiter zuweisen"-Dialog wird im Footer — analog zum bereits vorhandenen roten „X Zuweisungen werden entzogen" — zusätzlich ein grüner Hinweis angezeigt, wie viele **neue** Mitarbeiter den Auftrag zugewiesen bekommen.

### Umsetzung

**Datei:** `src/components/admin/AssignmentDialog.tsx`

1. **Neue Berechnung** neben `removedCount`:
   ```ts
   const addedCount = Array.from(selected).filter((id) => !existingIds.has(id)).length;
   ```
2. **Footer erweitern**: Vor dem bestehenden roten `removedCount`-Hinweis einen grünen Hinweis einfügen:
   - `1 neue Zuweisung wird vergeben` / `X neue Zuweisungen werden vergeben`
   - Styling: `text-sm text-emerald-600 dark:text-emerald-400 text-center`
3. Beide Hinweise können gleichzeitig sichtbar sein (z. B. wenn man jemanden entzieht UND jemand Neues zuweist).
4. Keine Änderung an `saveMutation`, Selection-Logik, Tabs oder E-Mail/SMS-Versand.

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/components/admin/AssignmentDialog.tsx` | `addedCount` berechnen + grünen Footer-Hinweis ergänzen |

### Erwartetes Ergebnis

```text
┌─────────────────────────────────────────┐
│ …Liste/Tabs…                            │
├─────────────────────────────────────────┤
│   3 neue Zuweisungen werden vergeben    │  ← grün
│   1 Zuweisung wird entzogen             │  ← rot (bestehend)
│              [Abbrechen]  [Speichern]   │
└─────────────────────────────────────────┘
```

