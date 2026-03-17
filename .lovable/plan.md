

## Plan: Fix create-caller-account Auth

### Problem

The edge function uses `callerClient.auth.getUser()` which makes a server-side session lookup. The auth logs show `session_not_found` at the exact time of the request. This is a known issue with the signing-keys system.

### Fix

**Datei:** `supabase/functions/create-caller-account/index.ts`

Replace `getUser()` with `getClaims()` to verify the JWT locally using signing keys instead of a server-side session lookup:

```typescript
// VORHER:
const callerClient = createClient(supabaseUrl, anonKey, {
  global: { headers: { Authorization: authHeader } },
});
const { data: { user: caller } } = await callerClient.auth.getUser();
if (!caller) { return 401 }

// NACHHER:
const callerClient = createClient(supabaseUrl, anonKey, {
  global: { headers: { Authorization: authHeader } },
});
const token = authHeader.replace("Bearer ", "");
const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
if (claimsError || !claimsData?.claims?.sub) { return 401 }
const callerId = claimsData.claims.sub;
```

Then use `callerId` instead of `caller.id` for the role check query.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `supabase/functions/create-caller-account/index.ts` | `getUser()` durch `getClaims()` ersetzen |

