

# Zwei Aenderungen: Sidebar-Flicker fixen und Registrierung entfernen

## 1. Admin-Sidebar: Keine Reiter anzeigen waehrend Berechtigungen laden

### Problem
Der Hook `useAdminPermissions` startet mit `allowedPaths = null` (= voller Zugriff) und `loading = true`. Die Sidebar prueft aber `loading` nicht und zeigt sofort alle Reiter an. Erst nach dem DB-Fetch werden die nicht erlaubten Reiter ausgeblendet -- das verursacht das kurze Aufblitzen.

### Loesung
In `src/components/admin/AdminSidebar.tsx`:
- Den `loading`-State aus `useAdminPermissions` mit auslesen
- Waehrend `loading === true` die gesamte Navigation ausblenden (nur Header und Footer der Sidebar anzeigen)

In `src/hooks/useAdminPermissions.ts`:
- Die `hasAccess`-Funktion so aendern, dass sie waehrend des Ladens **immer `false`** zurueckgibt statt `true`

```typescript
// useAdminPermissions.ts - hasAccess aendern:
const hasAccess = (path: string): boolean => {
  if (loading) return false;           // NEU: waehrend Laden nichts anzeigen
  if (allowedPaths === null) return true;
  return allowedPaths.includes(path);
};
```

```typescript
// AdminSidebar.tsx - loading auslesen:
const { hasAccess, loading } = useAdminPermissions();

// Im Render: Navigation erst nach Laden anzeigen
{!loading && navGroups.map((group, groupIndex) => {
  // ... bestehende Logik
})}
```

## 2. Registrierung aus /auth entfernen

### Loesung
In `src/pages/Auth.tsx`:
- Den `isRegister`-State und alle Register-States entfernen
- Die `handleRegister`-Funktion entfernen
- Das Registrierungsformular entfernen
- Den Umschalt-Link unten entfernen
- Ueberschrift fest auf "Willkommen" / "Melden Sie sich an." setzen

Die Seite zeigt dann nur noch das Login-Formular.

| Datei | Aenderung |
|-------|----------|
| `src/hooks/useAdminPermissions.ts` | `hasAccess` gibt waehrend Laden `false` zurueck |
| `src/components/admin/AdminSidebar.tsx` | `loading` auslesen, Navigation erst nach Laden rendern |
| `src/pages/Auth.tsx` | Registrierungsformular, States und Umschalt-Link entfernen |
