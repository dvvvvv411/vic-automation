### Ziel
Das hochgeladene for.tel Logo über dem "Brandings"-Titel auf `/admin/brandings` anzeigen.

### Schritte
1. Logo nach `public/fortellogo.png` kopieren (einfacher Pfad: `/fortellogo.png`).
2. In `src/pages/admin/AdminBrandings.tsx` über der Headline-Zeile ein `<img src="/fortellogo.png" alt="for.tel" />` einfügen (dezente Höhe, z.B. `h-10`, links ausgerichtet, kleiner Abstand nach unten).

### Nicht betroffen
- Andere Seiten, DB, Edge Functions.