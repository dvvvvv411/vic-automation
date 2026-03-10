

# Name klickbar + E-Mail kopierbar in Mitarbeiter-Tabelle

## Änderungen in `src/pages/admin/AdminMitarbeiter.tsx`

### 1. Name-Zelle (Zeile 177-179)
- Name als klickbaren Link stylen (`cursor-pointer`, `hover:text-primary`, `underline`)
- `onClick` → `navigate(/admin/mitarbeiter/${item.id})`

### 2. E-Mail-Zelle (Zeile 185)
- Gleiche Logik wie Telefonnummer: `cursor-pointer`, `hover:text-foreground`, `onClick` kopiert E-Mail ins Clipboard mit `toast.success("E-Mail kopiert!")`

