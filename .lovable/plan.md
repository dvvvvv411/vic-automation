

## Plan: Funnel-Statistik-Cards bei /admin/bewerbungen

### Uebersicht

Drei Statistik-Cards oberhalb der Tabelle, berechnet aus den bereits geladenen `applications`-Daten (kein zusaetzlicher Query noetig):

1. **Selbst registriert** — `!is_external && !is_indeed` — davon mit gebuchtem Termin (`interview_appointments.length > 0`)
2. **Extern hinzugefuegt** — `is_external === true` — davon mit gebuchtem Termin
3. **Indeed Bewerber** — `is_indeed === true` — davon mit gebuchtem Termin

### Aenderung

**`src/pages/admin/AdminBewerbungen.tsx`**

Nach dem `motion.div` Header-Bereich und vor der Tabelle werden drei Cards eingefuegt:

```tsx
const selfCount = applications?.filter(a => !a.is_external && !a.is_indeed) ?? [];
const externalCount = applications?.filter(a => a.is_external) ?? [];
const indeedCount = applications?.filter(a => a.is_indeed) ?? [];

const withBooking = (list) => list.filter(a => a.interview_appointments?.length > 0).length;
```

Drei nebeneinander liegende Cards (grid 3 cols), jede zeigt:
- Titel (z.B. "Selbst registriert")
- Gesamtzahl gross
- Darunter: "{n} mit Termin" + Prozent-Badge
- Farbiger Top-Border (blau/orange/gruen)

### Technische Details

- Kein neuer Query — alles aus dem bestehenden `applications` Array berechnet
- Import `Card, CardContent, CardHeader, CardTitle` (ggf. bereits importiert pruefen)
- Cards werden zwischen Header und Tabelle/Filter-Bereich platziert
- Prozent wird als `Math.round((withBooking / total) * 100)` berechnet, mit Fallback auf 0

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `AdminBewerbungen.tsx` | Card-Imports + 3 Statistik-Cards oberhalb der Tabelle |

