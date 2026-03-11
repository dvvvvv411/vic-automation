

# Fix: Bestehende order_assignments mit korrektem created_by füllen

## Problem

1. **test@test.de hat die Rolle `kunde`** (nicht admin)
2. Die kunde-RLS-Policy auf `order_assignments` erfordert `created_by = auth.uid()` -- NULL-Werte werden nicht akzeptiert (anders als bei admin, wo `created_by IS NULL` erlaubt ist)
3. **Alle** bestehenden order_assignments haben `created_by = NULL` -- auch die gerade erstellte Zuweisung für indeedpic, weil sie **vor** der DEFAULT-Migration erstellt wurde
4. Konsequenz: Kunde kann seine eigenen Zuweisungen nicht sehen UND nicht löschen (DELETE-Policy gleicher Check), was auch das Aktualisieren im Dialog unmöglich macht

## Lösung

**Eine Daten-Migration**: Alle `order_assignments` mit `created_by IS NULL` bekommen den `created_by`-Wert vom verknüpften `employment_contracts`-Eintrag. Das ist der korrekte Besitzer, da der Kunde den Mitarbeiter über sein Branding ongeboardet hat.

```sql
UPDATE order_assignments oa
SET created_by = ec.created_by
FROM employment_contracts ec
WHERE oa.contract_id = ec.id
  AND oa.created_by IS NULL
  AND ec.created_by IS NOT NULL;
```

Damit werden alle bestehenden Zuweisungen dem richtigen Kunden zugeordnet. Zukünftige Zuweisungen bekommen `created_by` automatisch durch den bereits gesetzten DEFAULT.

| Aktion | Detail |
|--------|--------|
| SQL UPDATE | Bestehende NULL `created_by` aus `employment_contracts.created_by` ableiten |
| Keine Code-Änderung | DEFAULT greift bereits für neue Inserts |

