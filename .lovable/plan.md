

# Fix: Livechat zeigt falschen Ansprechpartner für Kunde-Mitarbeiter

## Problem

In `ChatWidget.tsx` (Zeile 77-82) wird der Ansprechpartner immer über `user_roles.role = 'admin'` geladen — das findet immer den Haupt-Admin (Simon Heber). Mitarbeiter, die von einem Kundenkonto erstellt wurden, sollten stattdessen den Kunden als Ansprechpartner sehen.

## Lösung

Die `loadAdmin`-Funktion ändern: Statt pauschal den ersten Admin zu suchen, den `created_by` des `employment_contracts` des eingeloggten Mitarbeiters verwenden. Das ist die User-ID des Kunden (oder Admins), der den Mitarbeiter hinzugefügt hat.

### `src/components/chat/ChatWidget.tsx`

Die Logik in `loadAdmin` (Zeile 77-92) ersetzen:

1. Über `contractId` den `employment_contract` laden und dessen `created_by` lesen
2. Falls `created_by` vorhanden → Profil dieses Users laden (= der Kunde)
3. Falls `created_by` NULL → Fallback auf bisherige Logik (erster Admin)

```typescript
const loadAdmin = async () => {
  let ownerId: string | null = null;

  // Try to find the owner of this contract (kunde or admin)
  if (contractId) {
    const { data: contract } = await supabase
      .from("employment_contracts")
      .select("created_by")
      .eq("id", contractId)
      .maybeSingle();
    ownerId = contract?.created_by ?? null;
  }

  // Fallback: find first admin
  if (!ownerId) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1);
    ownerId = roles?.[0]?.user_id ?? null;
  }

  if (!ownerId) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url, display_name")
    .eq("id", ownerId)
    .maybeSingle();
  // ... rest stays the same
};
```

### RLS-Anpassung

Der Mitarbeiter braucht Lesezugriff auf das Profil des Kunden. Aktuell erlaubt die `profiles`-Policy nur Admin-Profile zu lesen (`Users can view admin profiles` prüft `role = 'admin'`). Eine neue Policy oder Erweiterung ist nötig:

```sql
-- Mitarbeiter können das Profil ihres Vertrags-Eigentümers sehen
CREATE POLICY "Users can view contract owner profile"
ON public.profiles FOR SELECT TO authenticated
USING (
  id IN (
    SELECT ec.created_by FROM employment_contracts ec
    WHERE ec.user_id = auth.uid() AND ec.created_by IS NOT NULL
  )
);
```

### Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/chat/ChatWidget.tsx` | `loadAdmin` → Contract-Owner statt erster Admin |
| Migration (SQL) | Neue RLS-Policy auf `profiles` für Contract-Owner-Zugriff |

