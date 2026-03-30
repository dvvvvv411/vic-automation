

## Plan: Notizfeld + Fehlgeschlagen-Grund bei 1. Arbeitstag

### 1. `BrandingNotes.tsx` — pageContext erweitern

Die `pageContext`-Typdefinition wird um `"erster-arbeitstag"` erweitert:
```
pageContext: "bewerbungsgespraeche" | "probetag" | "erster-arbeitstag"
```

### 2. `AdminErsterArbeitstag.tsx` — BrandingNotes einbinden

- `BrandingNotes` importieren und nach dem Header/vor den View-Buttons rendern (gleich wie bei Probetag/Bewerbungsgespraeche):
  `{activeBrandingId && <BrandingNotes brandingId={activeBrandingId} pageContext="erster-arbeitstag" />}`

### 3. `AdminErsterArbeitstag.tsx` — Fehlgeschlagen-Dialog mit Pflichtgrund

- Neue States: `failTarget` (item), `failReason` (string)
- Den direkten `handleStatusUpdate(item, "fehlgeschlagen")`-Klick ersetzen durch `setFailTarget(item); setFailReason("")`
- Dialog (gleich wie bei Bewerbungsgespraeche): Textarea fuer Grund, Button disabled wenn leer
- Bei Bestaetigung:
  1. `handleStatusUpdate(item, "fehlgeschlagen")` ausfuehren
  2. Notiz in `branding_notes` speichern mit `page_context: "erster-arbeitstag"` und Inhalt `"{Name} — Fehlgeschlagen: {Grund}"`
  3. `queryClient.invalidateQueries` fuer branding-notes

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/components/admin/BrandingNotes.tsx` | `pageContext` Typ um `"erster-arbeitstag"` erweitern |
| `src/pages/admin/AdminErsterArbeitstag.tsx` | BrandingNotes einbinden, Fehlgeschlagen-Dialog mit Grund + auto-Notiz |

