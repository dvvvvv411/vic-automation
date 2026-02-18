

# Umlaute korrigieren und Passwort-Hinweis entfernen

## Aenderungen in `src/pages/admin/AdminEmails.tsx`

### 1. Umlaute in allen Templates korrigieren
Alle Vorkommen von `ae`, `oe`, `ue` werden durch echte Umlaute ersetzt:

- "fuer" → "für"
- "pruefen" → "prüfen"
- "Kuerze" → "Kürze"
- "Gruessen" → "Grüßen"
- "koennen" → "können"
- "Gespraechstermin" → "Gesprächstermin"
- "naechsten" → "nächsten"
- "muessen" → "müssen"
- "Rueckmeldung" → "Rückmeldung"
- "Taetigkeit" → "Tätigkeit"
- "Pruefung" → "Prüfung"
- "wuenschen" → "wünschen"
- "fuellen" → "füllen"
- "Bestaetigung" → "Bestätigung"
- "bestaetigt" → "bestätigt"
- "Verfuegung" → "Verfügung"
- "durchfuehren" → "durchführen"
- "geprueft" → "geprüft"
- "Praemie" → "Prämie"
- "ausfuellen" → "ausfüllen"
- "Gespraech" → "Gespräch" (im bodyTitle und in Labels)

### 2. Passwort-Hinweis entfernen
Im Template "vertrag_genehmigt" (Index 4) die Zeile entfernen:
> "Bitte aendern Sie Ihr Passwort nach dem ersten Login. ..."

Der verbleibende Text wird aufgeteilt, sodass die Zugangsdaten und der Hinweis auf den Arbeitsvertrag erhalten bleiben, aber ohne den Satz zum Passwort ändern.

### Keine weiteren Dateien betroffen
Nur `src/pages/admin/AdminEmails.tsx` wird geändert.

