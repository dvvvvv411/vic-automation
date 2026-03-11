

# Fix: Anosim Share-Link gibt HTML statt JSON zurueck

## Ursache

Die URL `https://anosim.net/share/orderbooking?token=...` ist eine **Webseite** (liefert HTML). Der Proxy ruft `res.json()` auf und bekommt `<!DOCTYPE html>...` -- daher der Fehler `Unexpected token '<'`.

Die **API-URL** ist ein anderes Format: `https://anosim.net/api/v1/orderbookingshare?token=...` -- diese liefert JSON.

## Loesung

Im Proxy die Share-URL automatisch in die API-URL umwandeln, bevor der Fetch passiert. Zusaetzlich in den Frontend-Validierungen (`AdminTelefonnummern.tsx`, `SmsWatch.tsx`) ebenfalls die Konvertierung durchfuehren, damit in der DB immer die API-URL gespeichert wird.

| Datei | Aenderung |
|-------|-----------|
| `anosim-proxy/index.ts` | Share-URL zu API-URL konvertieren vor `fetch()` |
| `AdminTelefonnummern.tsx` | URL vor dem Speichern konvertieren |
| `SmsWatch.tsx` | URL vor dem Speichern konvertieren |

Konvertierungslogik:
```
anosim.net/share/orderbooking?token=X  →  anosim.net/api/v1/orderbookingshare?token=X
```

Die Edge Function muss danach neu deployed werden.

