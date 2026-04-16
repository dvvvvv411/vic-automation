

## Plan: Sichere, minimale Diagnose-Verbesserung (kein Risiko)

### Ziel
Keine Logikänderungen, keine neuen Features. Nur **Sichtbarkeit** der bereits bestehenden stillen Fehler verbessern, damit ihr beim nächsten Bewerber sofort seht, was schiefläuft.

### Eine einzige, risikofreie Änderung

**Datei: `src/pages/Bewerbungsgespraech.tsx`**

Im `bookMutation.onError`-Callback wird aktuell der Fehler stumm verschluckt (`onError: () => setConfirmOpen(false)`).

**Ergänzung (additiv, ändert kein Verhalten):**
- `console.error("Booking failed:", error)` -- damit der Fehler im Browser-Log landet
- `toast.error(error.message || "Termin konnte nicht gespeichert werden")` -- damit der Bewerber merkt, dass etwas schiefging und es erneut versucht

**Was NICHT geändert wird:**
- Keine RLS-Änderung
- Keine DB-Migration
- Keine Edge-Function-Änderung
- Keine Logik in der `mutationFn`
- Keine Duplikat-Prävention in `submit-application`
- Kein Refactoring

### Warum das sicher ist

Die Änderung betrifft ausschließlich den Error-Pfad. Wenn alles funktioniert (Happy Path), passiert exakt nichts Neues. Nur im Fehlerfall -- der heute schon auftritt, nur unsichtbar -- gibt es jetzt eine Toast-Meldung und einen Console-Log.

### Was ihr danach habt

Beim nächsten Bewerber, der den Termin nicht buchen kann:
1. Der Bewerber sieht eine Fehlermeldung statt eines verschwindenden Dialogs
2. Ihr könnt im Browser-Log die exakte Fehlerursache nachlesen
3. Damit lässt sich gezielt der echte Bug fixen, statt blind zu raten

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/Bewerbungsgespraech.tsx` | Nur `onError`-Callback um `console.error` + `toast.error` erweitert |

