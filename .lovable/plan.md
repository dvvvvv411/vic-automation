## Problem

Nach dem Revert scheint der GitHub-Sync nicht den aktuellen Stand übertragen zu haben. Die Preview zeigt die korrekte Auth-Seite (Card mit abgerundeten Ecken), aber der deployed Server über GitHub nicht.

## Lösung

Eine minimale, nicht-visuelle Code-Änderung in `src/pages/Auth.tsx` vornehmen, um einen neuen Commit zu erzwingen und den GitHub-Sync auszulösen.

### Änderung

Zeile 20: Leeren JSDoc-Kommentar oberhalb der `Auth`-Komponente hinzufügen.

```tsx
/** Auth page – login & registration with dynamic domain branding */
const Auth = () => {
```

Dadurch entsteht ein neuer Commit, der über Lovable's bidirektionale GitHub-Sync zu GitHub gepusht wird. Keine sichtbare UI-Änderung.