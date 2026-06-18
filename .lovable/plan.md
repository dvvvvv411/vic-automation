## Auth-Seite fullscreen (randlos)

**Ziel:** Die `/auth`-Seite füllt komplett den Viewport aus – keine äußeren Abstände, keine abgerundete Karte, kein max-width.

**Änderungen in `src/pages/Auth.tsx`:**

1. **Äußerer Wrapper**  
   Entferne `items-center justify-center p-4 md:p-8` und ersetze durch reines `min-h-screen flex bg-slate-50`.

2. **Innerer Container**  
   Entferne `max-w-6xl shadow-2xl rounded-3xl min-h-[800px]` und setze stattdessen `w-full min-h-screen`.

3. **Rechtes Panel (Formular)**  
   Behält sein Padding bei, damit Inhalte nicht am Bildschirmrand kleben.

**Ergebnis:** Der Split-Screen (bzw. auf Mobile das Formularpanel) erstreckt sich von Rand zu Rand über die volle Höhe.