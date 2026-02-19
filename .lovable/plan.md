
# Indeed Badge in CV-Spalte & E-Mail normal anzeigen

## Aenderungen in `src/pages/admin/AdminBewerbungen.tsx`

### 1. E-Mail-Spalte (Zeile 610)
Aktuell zeigt die E-Mail-Spalte bei Indeed-Bewerbern das "Indeed"-Badge statt der E-Mail. Das wird geaendert, sodass immer die E-Mail angezeigt wird:

```
// Vorher
{a.is_indeed ? <Badge>Indeed</Badge> : (a.email || "–")}

// Nachher
{a.email || "–"}
```

### 2. CV-Spalte (Zeilen 625-639)
Das Indeed-Badge wird in die CV-Spalte verschoben. Wenn ein Bewerber von Indeed kommt (`is_indeed`), wird dort das Badge angezeigt. Hat der Bewerber einen Lebenslauf hochgeladen, wird weiterhin das PDF-Icon angezeigt. Beides kann gleichzeitig erscheinen:

```
// Nachher
{a.is_indeed && <Badge variant="outline" className="text-[10px]">Indeed</Badge>}
{a.resume_url && <a href={...}><FileText /></a>}
{!a.is_indeed && !a.resume_url && "–"}
```

### 3. Detail-Dialog (Zeile 525)
Im Detail-Dialog wird ebenfalls die echte E-Mail angezeigt statt "Indeed":

```
// Vorher
{detailApp.is_indeed ? "Indeed" : (detailApp.email || "–")}

// Nachher
{detailApp.email || "–"}
```

## Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/pages/admin/AdminBewerbungen.tsx` | E-Mail-Spalte, CV-Spalte, Detail-Dialog |
