

# Fix: seven.io SMS-Antwort korrekt auswerten

## Problem

Die Edge Function `send-sms` prueft nur den HTTP-Statuscode (`smsResponse.ok`). seven.io gibt aber **immer HTTP 200** zurueck -- der tatsaechliche Erfolg/Fehler steht im Response-Body als numerischer Code (z.B. `100` = Erfolg, `900` = Authentifizierungsfehler, `402` = kein Guthaben).

Deshalb wird die SMS als "sent" geloggt, obwohl sie nicht zugestellt wurde.

## Loesung

Die Edge Function anpassen, um den seven.io Response-Body korrekt auszuwerten:

### Datei: `supabase/functions/send-sms/index.ts`

**Zeilen 70-71 anpassen:**

Vorher:
```text
const smsResult = await smsResponse.text();
const success = smsResponse.ok;
```

Nachher:
```text
const smsResult = await smsResponse.text();
console.log("seven.io raw response:", smsResult);

// seven.io returns "100" for success, other codes are errors
// The response can be JSON or a plain status code
let success = false;
try {
  const parsed = JSON.parse(smsResult);
  // JSON response: check success field or status code 100
  success = parsed.success === "100" || parsed.success === 100
    || (parsed.messages && parsed.messages.length > 0);
} catch {
  // Plain text response: "100" means success
  success = smsResult.trim().startsWith("100");
}
```

Zusaetzlich wird der Response-Body jetzt immer geloggt (`console.log`), damit wir bei zukuenftigen Problemen sofort den seven.io-Fehlercode sehen koennen.

### Warum nur eine Datei?

- Das Frontend (`AdminBewerbungen.tsx`) und die `sendSms`-Hilfsfunktion sind korrekt
- Der Short-Link wird erfolgreich erstellt
- Der SMS-Text wird korrekt zusammengebaut
- Einzig die Erfolgsauswertung in der Edge Function ist fehlerhaft

### Testen

Nach dem Fix: Bewerbung von "Max Indeed" erneut auf "neu" setzen und nochmal akzeptieren, um zu pruefen ob die SMS jetzt ankommt.
