

## Plan: Zeitfilter-Toggle durch Dropdown ersetzen

### Ziel
Auf `/admin/bewerbungen` wird der bestehende `ToggleGroup` (24h / 7 Tage / Gesamt) über den 4 Stat-Cards durch ein **Dropdown (Select)** ersetzt. Default bleibt **Gesamt**. Position: **links** statt rechts.

### Umsetzung

**Datei:** `src/pages/admin/AdminBewerbungen.tsx`

1. Imports anpassen: `ToggleGroup`/`ToggleGroupItem` entfernen, stattdessen `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` aus `@/components/ui/select` importieren.
2. `statsRange`-State bleibt unverändert (`"24h" | "7d" | "all"`, Default `"all"`).
3. Container über den Cards: `justify-end` → `justify-start` (linksbündig). Label „Zeitraum:" bleibt links neben dem Dropdown.
4. Dropdown:
   - Trigger ca. `w-[180px]`, kompakt
   - Items: `Gesamt`, `Letzte 7 Tage`, `Letzte 24 Stunden`
   - Wert bindet an `statsRange`, `onValueChange` setzt State
5. Der kleine „Stand: …"-Hinweis bleibt erhalten.

### Was NICHT geändert wird
- Keine Filter-/Berechnungslogik (`cutoff`, `inRange`, Stats-Buckets)
- Keine Tabelle, Suche, Mutationen, RLS, Edge Functions

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminBewerbungen.tsx` | ToggleGroup → Select, linksbündig positioniert |

### Erwartetes Ergebnis

```text
Zeitraum: [ Gesamt ▼ ]

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Selbst   │ │ Allgem.  │ │ META     │ │ Indeed   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

