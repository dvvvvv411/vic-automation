

## Plan: Store-Buttons durch SVG-Badges ersetzen mit Hover-Animation

### Aenderungen

| # | Ort | Was |
|---|-----|-----|
| 1 | `src/assets/` | Beide SVGs aus user-uploads kopieren |
| 2 | `src/pages/mitarbeiter/AuftragDetails.tsx` | Button-Elemente durch `<img>`-Tags mit den SVGs ersetzen, `transition-transform duration-200 hover:scale-105` hinzufuegen |

### Detail

In `AuftragDetails.tsx` (ca. Zeile 543-546) wird der aktuelle Block:

```tsx
{order.appstore_url && <a ...><Button variant="outline" size="sm" className="gap-2"><Apple ... /> App Store</Button></a>}
{order.playstore_url && <a ...><Button variant="outline" size="sm" className="gap-2"><Play ... /> Play Store</Button></a>}
```

ersetzt durch:

```tsx
{order.appstore_url && (
  <a href={order.appstore_url} target="_blank" rel="noopener noreferrer">
    <img src={appStoreBadge} alt="App Store" className="h-[40px] w-auto transition-transform duration-200 hover:scale-110" />
  </a>
)}
{order.playstore_url && (
  <a href={order.playstore_url} target="_blank" rel="noopener noreferrer">
    <img src={googlePlayBadge} alt="Google Play" className="h-[40px] w-auto transition-transform duration-200 hover:scale-110" />
  </a>
)}
```

Die SVGs werden als ES-Module importiert (`import appStoreBadge from "@/assets/app-store.svg"`).

