

# Fix: Leere Eintraege aus Mitarbeiterliste filtern

## Problem
Durch die Erweiterung des Status-Filters auf "offen" und "eingereicht" werden jetzt auch frisch angelegte `employment_contracts` angezeigt, die noch keine Daten haben (Name, Telefon, E-Mail sind alle NULL).

## Loesung
Zusaetzliche Filter in der Query: Nur Eintraege anzeigen, bei denen mindestens `first_name` nicht null ist.

### Aenderung in `AdminMitarbeiter.tsx` (Zeile 54)
Nach `.in("status", ...)` eine weitere Filterbedingung hinzufuegen:

```typescript
.not("first_name", "is", null)
```

Das filtert alle Vertraege raus, bei denen der Mitarbeiter seine Daten noch nicht ausgefuellt hat. Einzeilige Aenderung.

