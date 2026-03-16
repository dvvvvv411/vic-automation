

# Plan: Badge zählt Gruppen statt einzelne Anhänge

## Problem
Das Badge bei "Anhänge" in der Sidebar zählt einzelne `order_attachments` mit Status `eingereicht` (= 3), statt die Anzahl der **Gruppen** (contract_id + order_id Kombinationen) zu zählen (= 1).

## Lösung

In `AdminSidebar.tsx` (Zeilen 185-203): Die Query ändern, sodass sie nicht `count` mit `head: true` verwendet, sondern die tatsächlichen Rows fetcht und dann nach `contract_id + order_id` gruppiert, um die Anzahl **distinct Gruppen** zu zählen.

```typescript
const { data: anhaengeEingereichtCount } = useQuery({
  queryKey: ["badge-anhaenge-eingereicht", activeBrandingId],
  enabled: !!activeBrandingId,
  queryFn: async () => {
    const { data: contracts } = await supabase
      .from("employment_contracts")
      .select("id")
      .eq("branding_id", activeBrandingId!);
    const contractIds = (contracts ?? []).map((c) => c.id);
    if (!contractIds.length) return 0;
    const { data } = await supabase
      .from("order_attachments")
      .select("contract_id, order_id")
      .eq("status", "eingereicht")
      .in("contract_id", contractIds);
    // Count unique contract_id+order_id groups
    const groups = new Set((data ?? []).map((a: any) => `${a.contract_id}__${a.order_id}`));
    return groups.size;
  },
  refetchInterval: 30000,
});
```

### Betroffene Datei
| Datei | Änderung |
|-------|----------|
| `AdminSidebar.tsx` | Query zählt distinct Gruppen statt einzelne Rows |

