

## Fix: Email-Header Farbe — Gradient durch solide Farbe ersetzen

### Aenderung

In `supabase/functions/send-email/index.ts` den Header-Style von Gradient auf feste `background-color` umstellen.

**Zeile im Header-TD von:**
```html
background:linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 50%, ${brandColor}bb 100%)
```

**Zu:**
```html
background-color:${brandColor}
```

Edge Function danach neu deployen.

| Datei | Aenderung |
|---|---|
| `supabase/functions/send-email/index.ts` | Gradient → solide `background-color` |

