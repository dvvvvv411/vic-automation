
# Mitarbeiter mit unterzeichnetem Vertrag anzeigen

## Problem
In `AdminMitarbeiter.tsx` (Zeile 26) filtert die Query mit `.eq("status", "genehmigt")` - dadurch werden nur Mitarbeiter mit Status "genehmigt" geladen. Sobald ein Mitarbeiter seinen Vertrag unterzeichnet, wechselt der Status auf "unterzeichnet" und er verschwindet aus der Liste.

## Aenderungen

**Datei:** `src/pages/admin/AdminMitarbeiter.tsx`

### 1. Query-Filter erweitern (Zeile 26)
- `.eq("status", "genehmigt")` ersetzen durch `.in("status", ["genehmigt", "unterzeichnet"])`

### 2. `status` zum Select hinzufuegen (Zeile 25)
- Im `.select(...)` das Feld `status` ergaenzen, damit es im Frontend verfuegbar ist

### 3. Status-Badge dynamisch gestalten (ca. Zeile 103-106)
- Aktuell ist die Badge hardcoded auf orange "Nicht unterzeichnet"
- Neu: Wenn `item.status === "unterzeichnet"` wird eine gruene Badge angezeigt ("Unterzeichnet", `text-green-600 border-green-300 bg-green-50`)
- Wenn `item.status === "genehmigt"` bleibt die orangene Badge ("Nicht unterzeichnet", `text-orange-600 border-orange-300 bg-orange-50`)

Keine Datenbank-Aenderungen noetig - rein Frontend-Fix.
