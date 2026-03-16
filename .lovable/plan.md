

# Fix: Selbst-registrierte User in /admin/mitarbeiter anzeigen

## Problem
Bei der Selbstregistrierung wird ein `employment_contract` mit `status: "offen"` erstellt. Die Mitarbeiter-Liste unter `/admin/mitarbeiter` filtert aber nur nach `status IN ('genehmigt', 'unterzeichnet')` — deshalb erscheinen selbst-registrierte User dort nicht.

## Loesung
Den Status-Filter in `AdminMitarbeiter.tsx` um `"offen"` und `"eingereicht"` erweitern, damit alle relevanten Vertraege sichtbar sind.

### Aenderung
| Datei | Zeile | Aenderung |
|-------|-------|----------|
| `src/pages/admin/AdminMitarbeiter.tsx` | 54 | `.in("status", ["offen", "eingereicht", "genehmigt", "unterzeichnet"])` |

Einzeilige Aenderung.

