

## Plan: Arbeitsvertrag-Hinweis in der Mitarbeiter-Sidebar

### Konzept

Ein dauerhaft sichtbares Element unten in der Sidebar (ueber dem Footer/Logout), das den Nutzer auf den fehlenden Arbeitsvertrag hinweist — egal auf welchem Reiter er sich befindet. Verschwindet sobald der Vertrag eingereicht wurde.

### Aenderungen

**`src/components/mitarbeiter/MitarbeiterLayout.tsx`**
- `contract` Objekt um `submitted_at` erweitern und an `MitarbeiterSidebar` als neue Prop `contractSubmittedAt` weitergeben

**`src/components/mitarbeiter/MitarbeiterSidebar.tsx`**
- Neue Prop `contractSubmittedAt: string | null`
- Zwischen Navigation und Footer: Wenn `contractSubmittedAt` null ist, ein kompaktes amber-farbiges Element anzeigen mit FileText-Icon, kurzem Text ("Vertragsdaten ausfuellen") und Link zu `/mitarbeiter/arbeitsvertrag`
- Stil: Kleine Card mit `bg-amber-50 border border-amber-200 rounded-xl` im unteren Bereich der Sidebar (vor dem Footer), mit `mt-auto` um es nach unten zu druecken

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `MitarbeiterLayout.tsx` | `contractSubmittedAt` Prop an Sidebar weitergeben |
| `MitarbeiterSidebar.tsx` | Neue Prop + Hinweis-Element ueber dem Footer |

