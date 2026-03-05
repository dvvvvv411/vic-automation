

# SMS Watch Button -- Volle Nachricht anzeigen

## Aenderung

In `src/components/chat/SmsWatch.tsx` (Zeilen 112-126):

- `max-w-[220px]` entfernen und durch `max-w-md` ersetzen fuer mehr Breite
- Feste Hoehe `h-9` entfernen, stattdessen `h-auto min-h-9 py-1.5` fuer flexible Hoehe
- `truncate` vom SMS-Text entfernen, stattdessen `line-clamp-2 whitespace-normal` verwenden damit der Text ueber zwei Zeilen umbrechen kann

| Datei | Aenderung |
|---|---|
| `SmsWatch.tsx` | Button flexibel in Hoehe und Breite, Text mehrzeilig |

