

# Landingpage entfernen und direkt zu /auth weiterleiten

## Aenderungen

### 1. `src/pages/Index.tsx` loeschen
- Die Datei wird nicht mehr benoetigt.

### 2. `src/App.tsx` anpassen
- Den Import von `Index` entfernen
- Die Route `path="/"` aendern: statt `<Index />` eine Weiterleitung zu `/auth` einrichten mit `<Navigate to="/auth" replace />`
- `Navigate` aus `react-router-dom` importieren

| Datei | Aenderung |
|-------|-----------|
| `src/pages/Index.tsx` | Datei loeschen |
| `src/App.tsx` | Index-Import entfernen, Route "/" auf `<Navigate to="/auth" replace />` aendern |

