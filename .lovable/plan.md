

## Plan: SMS Spoof API von nigga.life auf LimitlessTXT umstellen

### Zusammenfassung
Die alte Spoof-API (nigga.life) wird vollständig durch die neue LimitlessTXT API (`api.limitlesstxt.com`) ersetzt. Route 7 wird immer verwendet. Ein neues Secret `LIMITLESSTXT_API_KEY` wird benötigt.

### Neues Secret

Du wirst aufgefordert, den LimitlessTXT API-Key (`ltxt_...`) als Supabase Secret `LIMITLESSTXT_API_KEY` hinzuzufügen.

### Änderungen

**1. Edge Function `supabase/functions/sms-spoof/index.ts`**

- **Send-Action**: API-Call ersetzen
  - Alt: `POST https://nigga.life/api/sms/send` mit `{ to, senderID, text }`
  - Neu: `POST https://api.limitlesstxt.com/v1/send` mit `{ numbers: [to], content: text, sender_id: senderID, route: 7 }`
  - Header: nur `Authorization: Bearer ${apiKey}` und `Content-Type: application/json` (keine gefälschten Browser-Header mehr)
  - API-Key lesen von `LIMITLESSTXT_API_KEY` statt `SMS_SPOOF_API_KEY`
  - Erfolgs-Check: `data.success === true`

- **HLR-Action**: Die alte HLR-API (`api.nigga.life/hlr/...`) existiert bei LimitlessTXT nicht. Zwei Optionen:
  - HLR komplett entfernen
  - Oder HLR-Button im Frontend deaktivieren/ausblenden

  Da LimitlessTXT keine HLR-API hat, wird die HLR-Action entfernt und der HLR-Button im Frontend ausgeblendet.

**2. Frontend `src/pages/admin/AdminSmsSpoof.tsx`**

- HLR-Lookup Button und Ergebnis-Anzeige entfernen (Zeilen 179-194, 401-404, 407-422)
- `hlrResult`, `hlrLoading`, `handleHlr` State/Handler entfernen

**3. Alle anderen Aufrufer bleiben unverändert**

Die Dateien `AdminBewerbungen.tsx`, `AdminProbetag.tsx` rufen `sms-spoof` mit `action: "send"` auf — die Parameter `to`, `senderID`, `text` werden in der Edge Function auf die neuen API-Felder gemappt. Keine Änderungen nötig.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `supabase/functions/sms-spoof/index.ts` | API-Endpunkt und Payload auf LimitlessTXT umstellen, HLR entfernen |
| `src/pages/admin/AdminSmsSpoof.tsx` | HLR-UI entfernen |

