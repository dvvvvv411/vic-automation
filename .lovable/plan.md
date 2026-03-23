

## Plan: Caller-Typ "Bewerbungsgespraeche" erhaelt auch Zugriff auf /admin/bewerbungen

### Aenderung

**Edge Function `create-caller-account/index.ts` (Zeile 97-98)**

Aktuell wird fuer `callerType === "bewerbungsgespraeche"` nur ein Pfad eingetragen:
```
/admin/bewerbungsgespraeche
```

Neu: Zwei Pfade eintragen:
```
/admin/bewerbungsgespraeche
/admin/bewerbungen
```

Analog zum Probetag-Block als Array-Insert.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `create-caller-account/index.ts` | Zweiten Pfad `/admin/bewerbungen` hinzufuegen |

