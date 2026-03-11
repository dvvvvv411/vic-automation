

# AssignmentDialog verbessern: Anstellungsart + Auftrags-Badge

## Änderungen in `src/components/admin/AssignmentDialog.tsx`

### 1. Query erweitern (Zeile 56)
`employment_contracts` Select um `employment_type` erweitern:
```
.select("id, first_name, last_name, email, employment_type")
```

### 2. Auftrags-Zählung laden
Neue Query: Alle `order_assignments` laden und pro `contract_id` zählen, um die Anzahl zugewiesener Aufträge pro Mitarbeiter anzuzeigen.

### 3. Item-Datenstruktur erweitern
Das `items`-Array bekommt zusätzliche Felder: `employmentType` und die Zählung wird beim Rendern aus den Assignment-Counts geholt.

### 4. UI pro Mitarbeiter-Zeile
- **Anstellungsart** als Text unter dem Namen (z.B. "Minijob", "Vollzeit")
- **Badge** mit Anzahl zugewiesener Aufträge (z.B. "3 Aufträge")

| Datei | Änderung |
|-------|----------|
| `AssignmentDialog.tsx` | Query erweitern, Assignment-Counts laden, UI mit employment_type + Badge |

