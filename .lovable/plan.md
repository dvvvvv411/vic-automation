

# Fix: Livechat zeigt falschen Ansprechpartner

## Ursache

Zwei Probleme:

1. **useEffect hat leere Dependencies `[]`** (Zeile 114): `contractId` wird asynchron geladen und ist initial `null`. Der Effect läuft einmal mit `null`, überspringt die Contract-Query, findet per Fallback Simon Heber (erster Admin) und läuft nie wieder.

2. **sessionStorage-Cache ist nicht contract-spezifisch**: Der Key `admin_chat_profile` speichert global ein Profil. Wenn Simon Heber einmal gecacht wurde, wird er sofort angezeigt.

## Lösung

In `src/components/chat/ChatWidget.tsx`:

1. **`contractId` als Dependency hinzufügen**: `}, [contractId])` statt `}, [])`
2. **Cache-Key contract-spezifisch machen**: `admin_chat_profile_${contractId}` statt `admin_chat_profile`
3. **Early return wenn contractId null**: Keinen Fallback laden wenn contractId noch nicht da ist

```typescript
useEffect(() => {
  if (!contractId) return;
  
  const cacheKey = `admin_chat_profile_${contractId}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try { setAdminProfile(JSON.parse(cached)); } catch {}
  }

  const loadAdmin = async () => {
    // ... existing logic (unchanged)
    if (profile) {
      const p = { ... };
      setAdminProfile(p);
      sessionStorage.setItem(cacheKey, JSON.stringify(p));
    }
  };
  loadAdmin();
}, [contractId]);
```

| Datei | Änderung |
|-------|----------|
| `src/components/chat/ChatWidget.tsx` | Dependency-Array + cache key fixen |

Keine Datenbank-Änderungen nötig.

