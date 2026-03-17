

## Header-Elemente entfernen im AdminLayout

In `src/components/admin/AdminLayout.tsx` die Suchleiste, Notification-Bell und Settings-Icon aus dem Header entfernen. Nur `SidebarTrigger` und Avatar bleiben.

### Änderung

- Entferne den Such-`div` (mit `Search`-Icon und Input)
- Entferne die `Bell`- und `Settings`-Buttons
- Entferne die ungenutzten Imports (`Bell`, `Search`, `Settings`)

| Datei | Änderung |
|---|---|
| `src/components/admin/AdminLayout.tsx` | Suchleiste, Bell, Settings aus Header entfernen |

