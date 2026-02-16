

# Auth-Seite: Domain-basiertes Branding-Logo

## Uebersicht

Beim Laden der Auth-Seite wird anhand der aktuellen Domain (`window.location.hostname`) das passende Branding aus der Datenbank geladen. Das Logo wird weiss dargestellt. Solange das Logo noch nicht geladen ist, wird die gesamte Seite nicht angezeigt (kein Flicker).

## Ablauf

1. Hostname ermitteln (z.B. `frik-maxeiner.de` oder `web.frik-maxeiner.de` -> `frik-maxeiner.de`)
2. Supabase-Query: `brandings` WHERE `domain` = hostname
3. Falls kein Treffer: Fallback-Query WHERE `domain` = `frik-maxeiner.de`
4. Erst wenn `logo_url` geladen ist, wird die Seite gerendert

## Technische Details

**Datei**: `src/pages/Auth.tsx`

### Neuer State und useEffect

```typescript
const [brandingLogoUrl, setBrandingLogoUrl] = useState<string | null>(null);
const [brandingReady, setBrandingReady] = useState(false);

useEffect(() => {
  const fetchBranding = async () => {
    // Subdomain-Prefix entfernen (z.B. "web.frik-maxeiner.de" -> "frik-maxeiner.de")
    let hostname = window.location.hostname;
    const parts = hostname.split(".");
    if (parts.length > 2) {
      hostname = parts.slice(-2).join(".");
    }

    const { data } = await supabase
      .from("brandings")
      .select("logo_url")
      .eq("domain", hostname)
      .maybeSingle();

    if (data?.logo_url) {
      setBrandingLogoUrl(data.logo_url);
    } else {
      // Fallback: frik-maxeiner.de
      const { data: fallback } = await supabase
        .from("brandings")
        .select("logo_url")
        .eq("domain", "frik-maxeiner.de")
        .maybeSingle();
      setBrandingLogoUrl(fallback?.logo_url ?? null);
    }
    setBrandingReady(true);
  };
  fetchBranding();
}, []);
```

### Loading-Guard

Vor dem eigentlichen `return` wird geprueft:

```typescript
if (!brandingReady) {
  return <div className="min-h-screen bg-background" />;
}
```

So wird ein leerer (aber farblich passender) Bildschirm gezeigt, bis das Logo da ist -- kein Flicker, kein Text-Umsprung.

### Logo-Rendering (linke Spalte)

Der bisherige `<h1>Vic Automation 2.0</h1>` Block wird ersetzt durch:

```tsx
{brandingLogoUrl ? (
  <img
    src={brandingLogoUrl}
    alt="Logo"
    className="max-h-16 w-auto object-contain brightness-0 invert"
  />
) : (
  <h1 className="text-4xl font-bold tracking-tight mb-2">Mitarbeiterportal</h1>
)}
```

Der CSS-Trick `brightness-0 invert` macht jedes Logo komplett weiss, unabhaengig von der Originalfarbe.

### Logo-Rendering (mobil)

Der mobile Logo-Bereich wird analog angepasst, aber ohne `invert` (da heller Hintergrund):

```tsx
{brandingLogoUrl ? (
  <img src={brandingLogoUrl} alt="Logo" className="max-h-12 w-auto object-contain mx-auto" />
) : (
  <h1 className="text-2xl font-bold tracking-tight text-foreground">Mitarbeiterportal</h1>
)}
```

### RLS

Anonyme User koennen `brandings` bereits lesen (Policy `Anon can select brandings` mit `qual: true` existiert). Keine Aenderung noetig.

### Zusammenfassung der Aenderungen

- **1 Datei**: `src/pages/Auth.tsx`
- Neuer State: `brandingLogoUrl`, `brandingReady`
- Neuer `useEffect` fuer Domain-basiertes Branding-Fetching
- Loading-Guard vor dem Render
- Logo statt "Vic Automation 2.0" in Desktop- und Mobil-Ansicht
- Weiss-Darstellung via `brightness-0 invert`

