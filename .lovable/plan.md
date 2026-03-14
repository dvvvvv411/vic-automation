

# Premium-Styling auf alle Admin-Unterseiten anwenden

## Referenz-Analyse

Das Vergleichspanel zeigt: saubere Tabellencontainer mit `rounded-lg` Border, klare Überschriften mit Beschreibungen, Avatar-Kreise bei Bewerbern, farbige Status-Badges, und eine aufgeräumte Suchleiste. Die globalen CSS-Regeln (Zebra-Striping, Hover, Table-Head-Styling) aus `index.css` greifen bereits automatisch — aber die Tabellencontainer und Page-Headers brauchen konsistentes Styling.

## Geplante Änderungen

### 1. `AdminBewerbungen.tsx` — Spalten entfernen + Premium-Polish
- **Spalten "Ort" und "Anstellungsart" entfernen** (TableHead + TableCell, Zeilen 869-870 und 902-911)
- Tabellencontainer hat bereits `border border-border rounded-lg` — passt

### 2. Alle Admin-Seiten: Konsistentes Premium-Styling

Die meisten Seiten verwenden bereits `motion.div` für Headers und `border border-border rounded-lg` für Tabellencontainer. Die globalen CSS-Regeln in `index.css` (Zebra-Striping, Hover-Highlight, uppercase Table-Heads) gelten bereits automatisch für alle `<table>` Elemente.

**Dateien die angepasst werden:**

| Datei | Änderung |
|-------|----------|
| `AdminBewerbungen.tsx` | Spalten "Ort" und "Anstellungsart" entfernen (Header + Body) |
| `AdminArbeitsvertraege.tsx` | Tabellencontainer auf `premium-card` upgraden, Page-Header vereinheitlichen |
| `AdminBewerbungsgespraeche.tsx` | Tabellencontainer auf `premium-card` upgraden |
| `AdminAuftraege.tsx` | Tabellencontainer auf `premium-card` upgraden |
| `AdminMitarbeiter.tsx` | Tabellencontainer auf `premium-card` upgraden |
| `AdminBewertungen.tsx` | Tabellencontainer auf `premium-card` upgraden |
| `AdminBrandings.tsx` | Tabellencontainer auf `premium-card` upgraden |
| `AdminTelefonnummern.tsx` | Premium-Card Styling |
| `AdminKunden.tsx` | Premium-Card Styling |
| `AdminEmails.tsx` | Premium-Card Styling |
| `AdminSmsHistory.tsx` | Premium-Card Styling |
| `AdminSmsSpoof.tsx` | Premium-Card Styling |
| `AdminSmsTemplates.tsx` | Premium-Card Styling |
| `AdminTelegram.tsx` | Premium-Card Styling |
| `AdminZeitplan.tsx` | Premium-Card Styling |
| `AdminAuftragstermine.tsx` | Premium-Card Styling |

### 3. Konkretes Muster für Tabellencontainer

Bestehend:
```html
<div className="border border-border rounded-lg overflow-hidden">
```

Neu (premium):
```html
<div className="premium-card overflow-hidden">
```

Die `premium-card` Klasse aus `index.css` bringt automatisch: `rounded-xl`, `border`, `bg-card`, subtle Shadow und Hover-Effekt.

### 4. Konkretes Muster für Page-Headers

Alle Seiten bekommen konsistent:
```tsx
<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
  <h2 className="text-2xl font-bold tracking-tight">Titel</h2>
  <p className="text-muted-foreground mt-1">Beschreibung</p>
</motion.div>
```

### Zusammenfassung
- 16 Admin-Seiten bekommen `premium-card` Tabellencontainer
- `AdminBewerbungen.tsx`: Spalten "Ort" und "Anstellungsart" werden entfernt
- Keine Funktionsänderungen

