
# Telefonnummer-Formatierung und Name-Normalisierung im Mass Import

## Uebersicht

Zwei Verbesserungen in der `parseMassImportLine`-Funktion in `src/pages/admin/AdminBewerbungen.tsx`:

1. **Telefonnummern automatisch formatieren**: Alle Sonderzeichen (Leerzeichen, `/`, `-`, `–`) entfernen und fuehrende `0` durch `+49` ersetzen.
2. **CAPSLOCK-Namen korrigieren**: Wenn ein Name komplett in Grossbuchstaben ist, wird er auf "Erster Buchstabe gross, Rest klein" umgewandelt (z.B. `SOPHIA` wird `Sophia`). Namen die bereits gemischt sind (z.B. `Gökkhan`) bleiben unveraendert.

## Aenderungen in `src/pages/admin/AdminBewerbungen.tsx`

### Neue Hilfsfunktionen (vor `parseMassImportLine`)

```typescript
function formatPhone(raw: string): string {
  // Alle Nicht-Ziffern entfernen ausser fuehrendes +
  let cleaned = raw.replace(/[^0-9+]/g, "");
  // Fuehrende 0 durch +49 ersetzen
  if (cleaned.startsWith("0")) {
    cleaned = "+49" + cleaned.substring(1);
  }
  return cleaned;
}

function formatName(name: string): string {
  // Nur korrigieren wenn komplett UPPERCASE
  if (name !== name.toUpperCase()) return name;
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}
```

### Aenderung in `parseMassImportLine`

Nach dem Parsen die Formatierung anwenden:

```typescript
const firstName = nameWords.slice(0, -1)
  .map(w => formatName(w)).join(" ");
const lastName = formatName(nameWords[nameWords.length - 1]);
const phone = formatPhone(phonePart);
```

### Beispiele

| Eingabe | Ergebnis |
|---------|----------|
| `0176 20497452` | `+4917620497452` |
| `0177/2714788` | `+491772714788` |
| `0151-46550162` | `+4915146550162` |
| `+49 1751649206` | `+491751649206` |
| `+49176-84420317` | `+4917684420317` |
| `039425 – 978016` | `+4939425978016` |
| `SOPHIA DAHN BATISTA` | `Sophia Dahn Batista` |
| `DENNIS GOESE` | `Dennis Goese` |
| `Svenja Böttner` | `Svenja Böttner` (unveraendert) |

## Keine Datenbank-Aenderungen

Nur Logik-Aenderung in einer Datei, keine neuen Abhaengigkeiten.
