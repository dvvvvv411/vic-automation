

## Plan: Suchleiste auf 4 Admin-Seiten einbauen

### Zusammenfassung
Auf den Seiten `/admin/arbeitsvertraege`, `/admin/idents`, `/admin/bewertungen` und `/admin/anhaenge` wird jeweils eine Suchleiste eingefügt, mit der nach Mitarbeiternamen gefiltert werden kann. Das bestehende Muster aus `AdminMitarbeiter.tsx` / `AdminErsterArbeitstag.tsx` wird übernommen: `Search`-Icon + `Input` mit `pl-9`.

### Änderungen pro Datei

**1. `src/pages/admin/AdminArbeitsvertraege.tsx`**
- `useState` für `search` hinzufügen, `Search` Icon und `Input` importieren
- Suchleiste zwischen Tabs und der Kartenliste einfügen
- `sortedItems` zusätzlich nach `first_name`/`last_name` filtern

**2. `src/pages/admin/AdminIdents.tsx`**
- `useState` für `search`, `Search` Icon und `Input` importieren
- Suchleiste nach dem Header einfügen
- `activeSessions`, `pendingIdents` und `completedSessions` nach Name filtern (über `getContractName` bzw. `contract_first_name`/`contract_last_name`)

**3. `src/pages/admin/AdminBewertungen.tsx`**
- `useState` für `search`, `Search` Icon und `Input` importieren
- Suchleiste zwischen Titel und Tabs einfügen
- `pendingReviews`, `approvedReviews`, `rejectedReviews` nach `employee_name` filtern

**4. `src/pages/admin/AdminAnhaenge.tsx`**
- `useState` für `search`, `Search` Icon und `Input` importieren
- Suchleiste zwischen Beschreibung und Tabelle einfügen
- `groups` nach `employee_name` filtern

### Suchleisten-Pattern (identisch auf allen 4 Seiten)
```tsx
const [search, setSearch] = useState("");

// Im JSX:
<div className="relative mb-4">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input placeholder="Name suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
</div>
```

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminArbeitsvertraege.tsx` | Search-State + Input + Filter auf sortedItems |
| `src/pages/admin/AdminIdents.tsx` | Search-State + Input + Filter auf alle 3 Sektionen |
| `src/pages/admin/AdminBewertungen.tsx` | Search-State + Input + Filter auf grouped Reviews |
| `src/pages/admin/AdminAnhaenge.tsx` | Search-State + Input + Filter auf groups |

