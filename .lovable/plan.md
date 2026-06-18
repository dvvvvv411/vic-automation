# Auth-Seite: Content wieder zentrieren

Das letzte Update hat die /auth-Seite zwar fullscreen ohne Rahmen gemacht, aber durch das Entfernen von `items-center justify-center` auf dem outer wrapper sitzt der Inhalt jetzt oben links statt mittig im Viewport.

## Änderungen

### `src/pages/Auth.tsx`

1. **Outer wrapper (Zeile ~186)** – Zentrierung wiederherstellen:
   ```
   Von: className="min-h-screen flex bg-slate-50"
   Zu:   className="min-h-screen flex items-center justify-center bg-slate-50"
   ```

2. **Inner container (Zeile ~187)** – Höhe einschränken, damit Zentrierung auf Desktop sichtbar wirkt:
   ```
   Von: className="w-full min-h-screen flex flex-col md:flex-row overflow-hidden bg-white"
   Zu:   className="w-full min-h-screen md:min-h-[800px] flex flex-col md:flex-row overflow-hidden bg-white"
   ```
   - Mobile bleibt `min-h-screen` (volle Höhe sinnvoll auf kleinen Screens)
   - Desktop maximiert nicht mehr die Höhe, sondern erlaubt vertikale Zentrierung

## Ergebnis
- Die Auth-Karte bleibt vollflächig (`w-full`, keine `max-w`, keine abgerundeten Ecken, kein Schatten)
- Der Inhalt wird aber wieder vertikal und horizontal im Viewport zentriert dargestellt
- Auf großen Monitoren schwebt das Formular elegant in der Mitte statt am oberen Rand zu kleben