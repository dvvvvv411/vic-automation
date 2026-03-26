

## Plan: Kunden-Rolle darf Mitarbeiter loeschen

### Problem

Die Edge Function `delete-employee` prueft nur auf `role = 'admin'` (Zeile 46). Kunden erhalten daher den Fehler "Nur Admins koennen Mitarbeiter loeschen".

### Aenderung

**`supabase/functions/delete-employee/index.ts`** (Zeilen 43-54)

Die Rollenprüfung wird erweitert: Statt nur `admin` wird auch `kunde` akzeptiert.

```typescript
const { data: roleCheck } = await adminClient
  .from("user_roles")
  .select("role")
  .eq("user_id", callerId)
  .in("role", ["admin", "kunde"])
  .limit(1)
  .maybeSingle();

if (!roleCheck) {
  return new Response(JSON.stringify({ error: "Keine Berechtigung zum Löschen" }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `supabase/functions/delete-employee/index.ts` | Rollenprüfung um `kunde` erweitern |

