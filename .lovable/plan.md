

## Plan: Tabs „Offen" / „Zugewiesen" im Mitarbeiter-zuweisen-Dialog

### Ziel
Im `/admin/auftraege` „Mitarbeiter zuweisen"-Popup zwei Tabs einbauen, die die Mitarbeiterliste nach aktuellem Zuweisungsstatus für den jeweiligen Auftrag splitten — inkl. Live-Counter im Tab-Label.

### Umsetzung

**Datei:** `src/components/admin/AssignmentDialog.tsx`

1. **Tabs einführen** (`@/components/ui/tabs`) zwischen Suchfeld und Liste, nur aktiv wenn `mode === "order"` (für `mode === "contract"` bleibt alles unverändert — single-list).
2. **Initialer Set `existingIds`** (bereits berechnet aus `existing`) dient als Quelle der Wahrheit für „bereits zugewiesen beim Öffnen".
3. **Liste in zwei Buckets aufteilen** (auf Basis von `filteredItems` + `existingIds`):
   - **Offen**: `!existingIds.has(item.id)` → noch nicht zugewiesen, Häkchen setzt Neuzuweisung
   - **Zugewiesen**: `existingIds.has(item.id)` → bereits zugewiesen, Häkchen-Entfernen markiert für Entzug (rote Hervorhebung wie heute)
4. **Tab-Trigger mit Count-Badge**:
   - `Offen (12)` — `openItems.length`
   - `Zugewiesen (3)` — `assignedItems.length`
   - Counts basieren auf **gefilterter** Liste (folgt der Suche), wie heute auch das Verhalten ist.
5. **Default-Tab**: `Offen` (häufigster Anwendungsfall: neu zuweisen).
6. **Empty-States** je Tab: „Alle Mitarbeiter bereits zugewiesen" / „Noch keine Zuweisungen für diesen Auftrag".
7. Bestehender Footer mit „X Zuweisungen werden entzogen" + Speichern-Button bleibt unverändert — die `selected`-Set-Logik und `saveMutation` werden nicht angefasst.

### Was NICHT geändert wird
- Keine DB-Änderung
- Keine Änderung an `saveMutation`, E-Mail/SMS-Versand, RLS
- `mode === "contract"`-Flow (Aufträge zuweisen aus Mitarbeitersicht) bleibt unverändert
- Such-Logik unverändert (filtert vor Tab-Split)

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/components/admin/AssignmentDialog.tsx` | Tabs „Offen"/„Zugewiesen" mit Live-Count im Label, Liste pro Tab, Empty-States |

### Erwartetes Ergebnis

```text
┌─────────────────────────────────────────┐
│ Mitarbeiter zuweisen                    │
│ Auftrag XY                              │
├─────────────────────────────────────────┤
│ 🔍 Name oder E-Mail suchen...           │
│ ┌─────────────────┬───────────────────┐ │
│ │ Offen (12)      │ Zugewiesen (3)    │ │
│ ├─────────────────┴───────────────────┤ │
│ │ ☐ Max Mustermann   max@…  Minijob   │ │
│ │ ☐ Anna Schmidt     anna@… Vollzeit  │ │
│ │ …                                   │ │
│ └─────────────────────────────────────┘ │
│                  [Abbrechen] [Speichern]│
└─────────────────────────────────────────┘
```

