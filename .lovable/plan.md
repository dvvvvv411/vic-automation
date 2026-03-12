

# Bug: Kein Button in "Gespräch erfolgreich"-E-Mail

## Ursache

In `AdminBewerbungsgespraeche.tsx` (Zeile 123-128) wird nach dem Status-Update der Arbeitsvertrag per Query gesucht:

```typescript
const { data: contract } = await supabase
  .from("employment_contracts")
  .select("id")
  .eq("application_id", item.application_id)
  .maybeSingle();
const contractLink = contract ? await buildBrandingUrl(...) : null;
```

**Problem:** Die RLS-Policy für `employment_contracts` erlaubt Admins nur den Zugriff auf Verträge mit `created_by = auth.uid()`. Der Vertrag wurde aber vom Trigger mit `created_by` des Appointment-Erstellers angelegt (User `d981ca8d`), nicht vom aktuellen Admin (User `7f509e3d`). Die Query gibt `null` zurück → kein Button.

## Lösung

Die Contract-Query ist unnötig. Der Trigger erstellt den Vertrag garantiert, und der Link basiert nur auf der `application_id`, die bereits bekannt ist. Die Query kann entfernt und der Link direkt gebaut werden:

```typescript
// Vorher: Query + Conditional
const { data: contract } = await supabase...
const contractLink = contract ? await buildBrandingUrl(...) : null;

// Nachher: Direkt bauen
const contractLink = await buildBrandingUrl(
  app.brandings?.id, 
  `/arbeitsvertrag/${item.application_id}`
);
```

### Betroffene Datei
| Datei | Änderung |
|-------|----------|
| `src/pages/admin/AdminBewerbungsgespraeche.tsx` | Zeilen 123-128: Contract-Query entfernen, Link direkt bauen |

