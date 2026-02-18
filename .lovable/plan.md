

# Mobile-Optimierung Mitarbeiter Dashboard

## 3 Aenderungen

### 1. Branding-Logo zentriert im Header (Mobile)

Im `MitarbeiterLayout.tsx` wird der Header so angepasst, dass auf Mobile das Branding-Logo mittig zentriert angezeigt wird. Dazu wird das Logo als absolut-zentriertes Element zwischen SidebarTrigger (links) und Avatar (rechts) platziert.

### 2. Sidebar: Weisser Hintergrund statt Glassmorphism

Die mobile Sidebar wird ueber ein Sheet-Overlay gerendert (in `sidebar.tsx`). Das `SheetContent` hat aktuell `bg-sidebar` als Hintergrund -- das ist oft halbtransparent. Die Loesung: In `MitarbeiterSidebar.tsx` wird explizit `bg-white` als Klasse gesetzt, damit die mobile Sidebar einen soliden weissen Hintergrund hat, identisch zur Desktop-Ansicht.

### 3. Sidebar schliesst automatisch bei Navigation (Mobile)

In `MitarbeiterSidebar.tsx` wird der `useSidebar`-Hook importiert. Bei jedem NavLink-Klick wird geprueft ob `isMobile` true ist, und falls ja `setOpenMobile(false)` aufgerufen, sodass die Sidebar sich automatisch schliesst.

---

## Technische Details

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/components/mitarbeiter/MitarbeiterLayout.tsx` | Logo zentriert im Header auf Mobile anzeigen (absolut positioniert) |
| `src/components/mitarbeiter/MitarbeiterSidebar.tsx` | `useSidebar` importieren; `bg-white` auf Sidebar setzen; onClick-Handler an NavLinks fuer auto-close auf Mobile |

### Header-Struktur (Mobile)

```text
+------------------------------------------+
| [=]     [LOGO zentriert]      [Avatar]   |
+------------------------------------------+
```

- SidebarTrigger links
- Logo absolut zentriert (pointer-events-none damit es Klicks nicht blockiert)
- Avatar/Email rechts

### Auto-Close Logik

```text
NavLink onClick -> if (isMobile) setOpenMobile(false)
```

Der `useSidebar`-Hook stellt `isMobile` und `setOpenMobile` bereit, die direkt in der MitarbeiterSidebar verfuegbar sind.

