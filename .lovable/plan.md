

## Plan: Serverseitige Suche für Mitarbeiter-Tabelle

### Problem
Die Suche filtert nur clientseitig auf der aktuell geladenen Seite (20 Einträge). Mitarbeiter auf anderen Seiten werden nie gefunden.

### Lösung
Wenn ein Suchbegriff eingegeben wird, die Suche serverseitig in der Supabase-Query durchführen und Seite auf 0 zurücksetzen.

### Änderungen in `src/pages/admin/AdminMitarbeiter.tsx`

1. **`search` in den queryKey aufnehmen** — damit bei Suchänderung neu gefetcht wird
2. **Seite auf 0 zurücksetzen** wenn sich der Suchbegriff ändert (`onChange` Handler)
3. **Serverseitige Filter**: Wenn `search.trim()` gesetzt ist, mit `.or()` nach `first_name`, `last_name`, `email`, `phone` filtern (ilike-Pattern)
4. **Client-Filter entfernen** — `sortedAndFiltered` braucht keinen `search`-Filter mehr, nur noch die Sortierung
5. **`totalPages` aus `data.total`** — funktioniert dann korrekt weil der Count die Suchfilter berücksichtigt

### Technisches Detail

```typescript
// queryKey inkl. search
queryKey: ["mitarbeiter", page, activeBrandingId, debouncedSearch],

// In queryFn, nach .in("status", [...]):
if (term) {
  query = query.or(
    `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`
  );
}
```

Optional ein kurzes Debounce (300ms) um nicht bei jedem Tastendruck eine Query auszulösen.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminMitarbeiter.tsx` | Serverseitige Suche + Page-Reset + Debounce |

