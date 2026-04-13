

## Plan: Bewertungs-Antworten werden bei Token-Refresh gelöscht

### Problem
`Bewertung.tsx` Zeile 71-89: Der `useEffect` hat `[contract, id]` als Dependency. Bei jedem Supabase-Token-Refresh bekommt `contract` eine neue Objekt-Referenz (weil `MitarbeiterLayout` es neu fetcht), wodurch der Effect erneut feuert und `setAnswers(qs.map(() => ({ rating: 0, comment: "" })))` alle Eingaben löscht.

### Lösung

**Datei: `src/pages/mitarbeiter/Bewertung.tsx`**

1. **Dependency auf `contract.id` statt `contract`**: Im useEffect nur `contract?.id` als Dependency verwenden (primitiver String, ändert sich nicht bei Token-Refresh)
2. **Guard gegen erneutes Laden**: Wenn `order` bereits geladen ist und die `id` sich nicht geändert hat, nicht erneut fetchen. Einfach ein Early-Return wenn `order?.id === id` bereits gesetzt ist.

```typescript
// Vorher:
useEffect(() => {
  if (!contract || !id) { ... }
  const fetch = async () => { ... };
  fetch();
}, [contract, id]);

// Nachher:
const contractId = contract?.id;

useEffect(() => {
  if (!contractId || !id) { setLoading(false); return; }
  
  // Bereits geladen? Nicht erneut fetchen
  if (order?.id === id) return;

  const fetchOrder = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, title, review_questions, required_attachments")
      .eq("id", id)
      .maybeSingle();

    if (!data) { setLoading(false); return; }
    setOrder(data);
    const qs = parseQuestions(data.review_questions);
    setAnswers(qs.map(() => ({ rating: 0, comment: "" })));
    setLoading(false);
  };
  fetchOrder();
}, [contractId, id]);
```

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/mitarbeiter/Bewertung.tsx` | useEffect-Dependency auf `contract?.id` ändern + Guard gegen doppeltes Laden |

