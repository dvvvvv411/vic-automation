

# "Auftrag fortführen" statt "Auftrag starten" bei existierender Ident-Session

## Problem
Wenn ein Mitarbeiter einen Videochat-Auftrag besucht hat und eine `ident_session` erstellt wurde, aber noch keine Testdaten hinterlegt sind (Status `waiting`), zeigt die Card weiterhin "Auftrag starten" statt "Auftrag fortführen".

## Lösung
In beiden Dateien (`MitarbeiterAuftraege.tsx` und `MitarbeiterDashboard.tsx`) beim Laden der Aufträge zusätzlich prüfen, ob für den jeweiligen Auftrag bereits eine `ident_session` existiert. Falls ja und der Assignment-Status noch `offen` ist, den Button-Text auf "Auftrag fortführen" ändern.

### Änderungen

**1. `MitarbeiterAuftraege.tsx`**
- Im `fetchData` zusätzlich `ident_sessions` für alle `orderIds` + `contract.id` laden
- Ein Set/Map `ordersWithIdentSession` erstellen, das Order-IDs enthält, die bereits eine Session haben
- `Assignment`-Interface um `hasIdentSession: boolean` erweitern
- `StatusButton` erhält `hasIdentSession` als Prop; im `default`-Case (Status `offen`): wenn `hasIdentSession` → "Auftrag fortführen" mit `Play`-Icon statt "Auftrag starten" mit `ExternalLink`-Icon

**2. `MitarbeiterDashboard.tsx`**
- Gleiche Logik: `ident_sessions` für offene Aufträge abfragen
- `StatusButton` analog anpassen

### Beispiel Button-Änderung (default case)
```tsx
default:
  return (
    <Button ...>
      {hasIdentSession ? "Auftrag fortführen" : "Auftrag starten"}
      {hasIdentSession 
        ? <Play className="h-3.5 w-3.5 ml-1.5" />
        : <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
      }
    </Button>
  );
```

### Query für Ident-Sessions
```tsx
const { data: identSessions } = await supabase
  .from("ident_sessions")
  .select("order_id")
  .eq("contract_id", contract.id)
  .in("order_id", orderIds);

const orderIdsWithSession = new Set((identSessions ?? []).map(s => s.order_id));
```

| Datei | Änderung |
|-------|----------|
| `MitarbeiterAuftraege.tsx` | Ident-Sessions laden, `hasIdentSession` an Assignment + Button |
| `MitarbeiterDashboard.tsx` | Gleiche Logik für Dashboard-Cards |

