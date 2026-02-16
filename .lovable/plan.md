
# Trust-Points als lebendige Glassmorphism-Cards

## Aenderung

Die drei Trust-Points werden von einfachen Icon+Text-Zeilen zu modernen, glassmorphen Cards umgestaltet. Jede Card bekommt einen halbtransparenten Hintergrund, Blur-Effekt, einen subtilen Border und eine Hover-Animation.

## Design

Jede Card erhaelt:
- **Glassmorphism-Hintergrund**: `bg-white/10 backdrop-blur-sm` mit `border border-white/20`
- **Groesseres Layout**: `rounded-2xl p-5` mit mehr Platz fuer Icon und Text
- **Gradient-Icon-Container**: `bg-gradient-to-br from-white/20 to-white/5` mit abgerundetem Kreis (`rounded-xl w-12 h-12`)
- **Hover-Effekt**: `hover:bg-white/15 hover:-translate-y-1 transition-all duration-300` fuer einen subtilen Lift-Effekt
- **Grid-Layout**: Die drei Cards werden in einem `grid grid-cols-1 gap-4` angeordnet statt `space-y-6`
- **Animation**: Eingangsanimation bleibt (staggered fade-in), ergaenzt durch `scale-in` via framer-motion (`initial scale: 0.95`)

## Technische Details

**Datei**: `src/pages/Auth.tsx`, Zeilen 138-156

Ersetze den aktuellen `space-y-6` Container und die schlichten Zeilen durch:

```tsx
<div className="grid grid-cols-1 gap-4 w-full max-w-sm">
  {trustPoints.map((point, i) => (
    <motion.div
      key={point.title}
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.3 + i * 0.15 }}
      className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 hover:bg-white/15 hover:-translate-y-1 transition-all duration-300 cursor-default"
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-white/25 to-white/5">
        <point.icon className="w-6 h-6" />
      </div>
      <div>
        <p className="font-semibold text-sm">{point.title}</p>
        <p className="text-sm text-white/60">{point.desc}</p>
      </div>
    </motion.div>
  ))}
</div>
```

Keine neuen Dateien oder Abhaengigkeiten noetig.
