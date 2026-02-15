

# Logo-Anzeige in der Sidebar: Nur Logo, zentriert, ohne Box

## Aenderung

**Datei**: `src/components/mitarbeiter/MitarbeiterSidebar.tsx` (Zeilen 38-68)

Der gesamte Branding-Header-Bereich wird vereinfacht:

- **Kein Firmenname-Text** mehr neben dem Logo
- **Keine Box/Card** um das Logo (kein `bg-muted`, kein `rounded-lg`, kein `p-1`)
- **Logo zentriert** mit `flex justify-center items-center`
- **Logo skaliert** auf die volle verfuegbare Breite mit `max-h-14 w-auto object-contain` (passt sich proportional an)
- **Transparenter Hintergrund** -- keine Hintergrundfarbe, kein Border

### Vorher

```text
+----------------------------+
| [Logo-Box] Firmenname      |
+----------------------------+
```

### Nachher

```text
+----------------------------+
|        [Logo gross]        |
+----------------------------+
```

### Konkrete Aenderungen

**Zeilen 38-67** werden ersetzt durch:

```tsx
<div className="py-5 px-4 border-b border-border flex justify-center items-center">
  {brandingLoading ? (
    <Skeleton className="h-10 w-32" />
  ) : branding?.logo_url ? (
    <img
      src={branding.logo_url}
      alt={branding.company_name}
      className="max-h-14 w-auto object-contain"
    />
  ) : (
    <span className="text-sm font-semibold text-foreground">
      {branding?.company_name || "Unbekannt"}
    </span>
  )}
</div>
```

- Logo ohne jegliche Box-Styles, direkt auf transparentem Hintergrund
- Zentriert in der Sidebar
- `max-h-14` begrenzt die Hoehe, `w-auto` laesst die Breite proportional skalieren
- Fallback: Nur Firmenname als Text (wenn kein Logo vorhanden)

