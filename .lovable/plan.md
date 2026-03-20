

## SMS-Absendername aus Branding bei Bewerbungsgespraech-Buchung

### Problem

In `Bewerbungsgespraech.tsx` (Zeile 217-223) wird `sendSms` ohne `from`-Parameter aufgerufen. Dadurch verwendet die Edge Function den Default-Absender "Vic" statt den im Branding konfigurierten `sms_sender_name`.

### Aenderung

**Datei: `src/pages/Bewerbungsgespraech.tsx`**

Vor dem SMS-Versand den `sms_sender_name` aus dem Branding laden und als `from` uebergeben:

```typescript
let smsSender: string | undefined;
if (application.branding_id) {
  const { data: branding } = await supabase
    .from("brandings")
    .select("sms_sender_name")
    .eq("id", application.branding_id)
    .single();
  smsSender = (branding as any)?.sms_sender_name || undefined;
}
await sendSms({
  to: application.phone,
  text: smsText,
  event_type: "gespraech_bestaetigung",
  recipient_name: applicantName,
  from: smsSender,
  branding_id: application.branding_id,
});
```

Gleiche Pruefung auch in `Probetag.tsx` durchfuehren, falls dort dasselbe Problem besteht.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/Bewerbungsgespraech.tsx` | `sms_sender_name` laden, als `from` uebergeben |
| `src/pages/Probetag.tsx` | Gleiche Aenderung falls `from` fehlt |

Keine DB-Migration noetig.

