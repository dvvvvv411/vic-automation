## Ziel
SMS Spoof soll wieder funktionieren, indem die Edge Function exakt die neue EliteGateway API-Doku nutzt.

## Befund
Die Funktion sendet aktuell den Header als `api_key`. Laut Fehler kommt beim Anbieter aber an: `missing header api-key`.

Die Doku zeigt zwar im Text `api_key`, die konkrete Fehlermeldung verlangt aber eindeutig `api-key`. Daher sollte die Anfrage beide Header mitschicken, damit beide Varianten abgedeckt sind.

## Änderungen
1. **`supabase/functions/sms-spoof/index.ts` anpassen**
   - Bei `fetch("https://api.elitegateway.net/api/send/sms")` zusätzlich zum bestehenden Header auch setzen:
     - `api-key: <ELITEGATEWAY_API_KEY>`
     - `api_key: <ELITEGATEWAY_API_KEY>`
   - Payload unverändert passend zur Doku lassen:
     - `SID`
     - `Content`
     - `number`

2. **Fehlerausgabe verbessern**
   - Wenn EliteGateway `suc: false` zurückgibt, die konkrete `message` sauber an den Client zurückgeben.
   - Logging ohne Secret-Ausgabe beibehalten.

3. **Deploy**
   - `sms-spoof` Edge Function neu deployen.

## Nicht ändern
- Keine DB-Änderungen.
- Keine UI-Änderungen.
- Keine Secrets neu abfragen, `ELITEGATEWAY_API_KEY` existiert bereits.

## Erwartetes Ergebnis
Der Anbieter erhält den erwarteten `api-key` Header und SMS-Versand läuft wieder über `/api/send/sms`.