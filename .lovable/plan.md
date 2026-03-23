

## Plan: Favicon auf Buchungsseiten korrekt laden

### Problem

Die Seiten `/bewerbungsgespraech`, `/probetag` und `/erster-arbeitstag` laden Branding-Daten per `application.branding_id`, aber:
1. `favicon_url` wird nicht im Select abgefragt
2. Das Favicon-Element wird nicht aktualisiert

Das `index.html` Inline-Script setzt das Favicon nur domain-basiert beim ersten Laden — wenn die Domain nicht zum Branding passt (z.B. Lovable-Preview), bleibt das Standard-Favicon.

### Aenderungen

In allen 3 Dateien (`Bewerbungsgespraech.tsx`, `Probetag.tsx`, `ErsterArbeitstag.tsx`):

1. `favicon_url` zum Supabase-Select der `brandings`-Relation hinzufuegen
2. Ein `useEffect` einfuegen, das bei geladenem Branding das Favicon-Element (`#app-favicon`) aktualisiert — analog zur Logik in `BrandingContext.tsx`

### Beispiel (identisch fuer alle 3 Dateien)

```typescript
// Select erweitern:
.select("*, brandings(company_name, logo_url, brand_color, favicon_url, ...)")

// useEffect hinzufuegen:
useEffect(() => {
  const faviconUrl = application?.brandings?.favicon_url;
  const el = document.getElementById("app-favicon") as HTMLLinkElement | null;
  if (el) el.href = faviconUrl || "/favicon.png";
}, [application]);
```

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `Bewerbungsgespraech.tsx` | `favicon_url` im Select + useEffect |
| `Probetag.tsx` | `favicon_url` im Select + useEffect |
| `ErsterArbeitstag.tsx` | `favicon_url` im Select + useEffect |

