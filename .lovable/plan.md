

## Plan: Arbeitsvertrag-Hinweis groesser und in Brandingfarbe

### Aenderung

**`src/components/mitarbeiter/MitarbeiterSidebar.tsx`** (Zeilen 98-109)

Das bestehende amber-farbige Element wird groesser, auffaelliger und nutzt die Branding-Primaerfarbe statt Amber:

- Padding von `p-3` auf `p-4`
- Hintergrund: `bg-primary/10` mit `border-primary/30` (nutzt die CSS-Variable `--primary` die bereits aus dem Branding gesetzt wird)
- Icon groesser: `h-6 w-6` statt `h-5 w-5`, Farbe `text-primary`
- Titel groesser: `text-sm font-semibold` statt `text-xs font-medium`, Farbe `text-primary`
- Untertitel: `text-xs` statt `text-[10px]`, Farbe `text-primary/70`
- Hover: `hover:bg-primary/20`
- Margin: `mx-3 mb-3` fuer etwas mehr Abstand

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `MitarbeiterSidebar.tsx` | Styling des Contract-Reminder Elements anpassen |

