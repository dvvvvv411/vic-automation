## Ziel
Eine öffentliche `/karriere`-Route, die sofort und ohne Verzögerung zu `https://for-tel.solutions/karriere/onlineprozess-tests` weiterleitet.

## Änderungen
1. **Neue Komponente** `src/pages/KarriereRedirect.tsx`
   - Ruft direkt im `useEffect` beim Mounten `window.location.replace(...)` auf.
   - Kein sichtbares UI, keine Verzögerung.

2. **Route hinzufügen** in `src/App.tsx`
   - `<Route path="/karriere" element={<KarriereRedirect />} />`
   - Als öffentliche Route außerhalb von `AuthProvider` einfügen (wie `/bewerbungsgespraech/buchen`, `/arbeitsvertrag/:id`, etc.)

## Nicht betroffen
- Keine DB-Änderungen
- Keine Edge-Function-Änderungen
- Keine existierenden Seiten angefasst