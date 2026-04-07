

## Plan: Öffentliche Routen aus AuthProvider herauslösen

### Problem

Alle Routen — auch öffentliche wie `/erster-arbeitstag/:id` — laufen unter `AuthProvider` und `QueryCacheClearer`. Wenn eine eingeloggte Nutzerin die Seite öffnet und ihr Token abgelaufen ist, feuert `QueryCacheClearer` bei jedem Auth-State-Wechsel `queryClient.clear()` und löscht damit die laufende `publicSupabase`-Abfrage. Die Seite bleibt ewig in den Skeletons hängen.

### Lösung

**Datei: `src/App.tsx`**

Öffentliche Routen AUSSERHALB von `AuthProvider` und `QueryCacheClearer` rendern. Diese Routen brauchen keine Auth-Session:

```text
<QueryClientProvider>
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        {/* Öffentliche Routen — OHNE AuthProvider */}
        <Route path="/erster-arbeitstag/:id" element={<ErsterArbeitstag />} />
        <Route path="/probetag/:id" element={<Probetag />} />
        <Route path="/bewerbungsgespraech/:id" element={<Bewerbungsgespraech />} />
        <Route path="/bewerbungsgespraech/buchen" element={<BewerbungsgespraechPublic />} />
        <Route path="/arbeitsvertrag/:id" element={<Arbeitsvertrag />} />
        <Route path="/r/:code" element={<ShortRedirect />} />

        {/* Alles andere — MIT AuthProvider */}
        <Route path="/*" element={
          <AuthProvider>
            <QueryCacheClearer />
            <Routes>
              <Route path="/" element={<Navigate to="/auth" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={...}>
                ...alle admin routes...
              </Route>
              <Route path="/mitarbeiter" element={...}>
                ...alle mitarbeiter routes...
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        } />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
</QueryClientProvider>
```

**Zusätzlich: `src/pages/ShortRedirect.tsx`**

ShortRedirect verwendet noch den normalen `supabase`-Client. Da es jetzt außerhalb von AuthProvider liegt, auf `publicSupabase` umstellen:

```typescript
import { publicSupabase as supabase } from "@/integrations/supabase/publicClient";
```

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/App.tsx` | Öffentliche Routen aus AuthProvider herauslösen |
| `src/pages/ShortRedirect.tsx` | `supabase` → `publicSupabase` |

### Erwartetes Ergebnis

- `/erster-arbeitstag/:id` lädt sofort, egal ob eingeloggt oder nicht
- Kein `queryClient.clear()` kann mehr die Buchungsseiten-Queries löschen
- Kein Whitescreen / endlose Skeletons mehr auf Mobilgeräten

