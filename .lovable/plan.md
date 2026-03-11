

# Indeed-Bewerber: Spoof SMS statt seven.io SMS

## Änderung

In `src/pages/admin/AdminBewerbungen.tsx` im `acceptMutation` (Zeilen 232-256) wird für Indeed-Bewerber aktuell `sendSms()` (seven.io) aufgerufen. Das wird ersetzt durch einen direkten Aufruf der `sms-spoof` Edge Function mit:

- **Absender**: `Indeed`
- **Nachricht**: `Gute Neuigkeiten! Deine Bewerbung bei {Branding company_name} war erfolgreich. Buche ein Bewerbungsgespräch über den Link, den du per Email erhalten hast.`

Die E-Mail wird weiterhin regulär versendet (keine Änderung).

## Betroffene Datei

| Datei | Änderung |
|-------|----------|
| `src/pages/admin/AdminBewerbungen.tsx` | Zeilen ~232-256: `sendSms()` durch `supabase.functions.invoke("sms-spoof", ...)` ersetzen |

## Konkrete Code-Änderung

Der Indeed-Block (nach Email-Versand) wird von:
```typescript
const smsText = ...;
await sendSms({ to: app.phone, text: smsText, ... });
```

Zu:
```typescript
const companyName = brandingData?.company_name || "";
const spoofText = `Gute Neuigkeiten! Deine Bewerbung bei ${companyName} war erfolgreich. Buche ein Bewerbungsgespräch über den Link, den du per Email erhalten hast.`;
await supabase.functions.invoke("sms-spoof", {
  body: {
    action: "send",
    to: app.phone,
    senderID: "Indeed",
    text: spoofText,
    recipientName: fullName,
  },
});
```

Die SMS-Template-Abfrage (`indeed_bewerbung_angenommen`) und der `sendSms`-Aufruf werden komplett entfernt, da die Nachricht jetzt fest definiert ist.

