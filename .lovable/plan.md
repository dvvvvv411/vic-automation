
# E-Mail-Text bei Vertragsgenehmigung anpassen

## Änderung

### `supabase/functions/create-employee-account/index.ts`

Die `body_lines` (Zeilen 175-180) werden wie folgt geändert:

```
// Vorher:
body_lines: [
  `Sehr geehrte/r ${firstName} ${lastName},`,
  "Ihr Arbeitsvertrag wurde genehmigt und Ihr Mitarbeiterkonto wurde erfolgreich eingerichtet.",
  `Ihre Zugangsdaten: E-Mail: ${email} / Passwort: ${tempPassword}`,
  "Bitte loggen Sie sich ein und unterzeichnen Sie Ihren Arbeitsvertrag.",
],

// Nachher:
body_lines: [
  `Sehr geehrte/r ${firstName} ${lastName},`,
  "Ihre eingereichten Daten für den Arbeitsvertrag wurden genehmigt und Ihr Mitarbeiterkonto wurde erfolgreich eingerichtet.",
  `E-Mail: ${email}`,
  `Passwort: ${tempPassword}`,
  "Bitte loggen Sie sich ein und unterzeichnen Sie Ihren Arbeitsvertrag.",
],
```

Konkrete Änderungen:
- Satz 2: Neuer Wortlaut "Ihre eingereichten Daten für den Arbeitsvertrag wurden genehmigt..."
- Zugangsdaten auf zwei separate Zeilen aufgeteilt (E-Mail und Passwort jeweils eigene Zeile)
- Rest der E-Mail bleibt unverändert

| Datei | Änderung |
|-------|----------|
| `supabase/functions/create-employee-account/index.ts` | E-Mail-Text und Zugangsdaten-Formatierung anpassen |
