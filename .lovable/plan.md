## Plan: SMS-Spoof auf EliteGateway API umstellen

Die Spoof-SMS-Versand-Logik läuft zentral über eine einzige Edge Function (`sms-spoof`). Alle Aufrufer im Admin-Panel (AdminSmsSpoof, AdminProbetag, AdminBewerbungen, AdminBrandingForm) rufen diese Function auf – es muss daher nur die Function selbst umgestellt werden.

### Änderungen

1. **Edge Function `supabase/functions/sms-spoof/index.ts`**
   - Endpoint wechseln: `http://api.mailgun.xyz/api/sendsmsvia/token` → `https://api.elitegateway.net/api/send/sms`
   - Header wechseln: `api-key-token` → `api_key` (mit dem neuen Secret `ELITEGATEWAY_API_KEY`)
   - Request-Body anpassen: `{ number, senderID, text }` → `{ SID: senderID, Content: text, number }`
   - Erfolgs-Erkennung: HTTP 2xx **und** `suc === true` im Response-Body (statt der bisherigen `error`-Feld-Prüfung)
   - Logging in `sms_spoof_logs` und `decrement_spoof_credits` bleiben unverändert (nur bei Erfolg)
   - Rufnummern-Normalisierung bleibt unverändert (international, ohne `+`, z. B. `49152…`) – passt zum von EliteGateway erwarteten Format

2. **Secret**
   - `ELITEGATEWAY_API_KEY` ist bereits hinterlegt
   - Das alte `MAILGUN_XYZ_API_KEY` bleibt im Secret-Store; nicht mehr referenziert. Auf Wunsch kann es später entfernt werden.

3. **Keine Änderungen nötig an**
   - Frontend (AdminSmsSpoof, AdminProbetag, AdminBewerbungen, AdminBrandingForm, AdminSmsHistory) – das Aufruf-Interface (`action: "send"`, `to`, `senderID`, `text`, …) bleibt identisch
   - Datenbank, RLS, Tabellen, Credits-Logik

### Technische Details

Neuer Request:
```ts
fetch("https://api.elitegateway.net/api/send/sms", {
  method: "POST",
  headers: { api_key: ELITEGATEWAY_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ SID: senderID, Content: text, number }),
});
```

Erfolgs-Check:
```ts
const isSuccess = res.ok && data?.suc === true;
```

Nach dem Switch teste ich den Versand über `AdminSmsSpoof` und prüfe die Edge-Function-Logs auf `suc: true`.