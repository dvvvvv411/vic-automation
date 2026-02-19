

# Indeed-Bewerbungen: E-Mail-Pflichtfeld + E-Mail-Versand bei Annahme

## Aenderungen

### 1. Validierung (`indeedSchema`) - E-Mail hinzufuegen

Das `indeedSchema` (Zeile 54-59) wird um ein Pflichtfeld `email` erweitert:

```typescript
const indeedSchema = z.object({
  first_name: z.string().trim().min(1, "Vorname erforderlich").max(100),
  last_name: z.string().trim().min(1, "Nachname erforderlich").max(100),
  email: z.string().trim().email("Ungueltige E-Mail").max(255),
  phone: z.string().trim().min(1, "Telefon erforderlich").max(50),
  branding_id: z.string().uuid("Branding erforderlich"),
});
```

### 2. Formular-UI - E-Mail-Feld auch bei Indeed anzeigen

Das E-Mail-Feld (Zeile 420-426) wird nicht mehr durch `!isIndeed` ausgeblendet -- es wird immer angezeigt und ist immer Pflicht.

### 3. Submit-Handler - E-Mail bei Indeed mitsenden

Im `handleSubmit` (Zeile 294-300) wird `email` zum Indeed-Payload hinzugefuegt:

```typescript
createMutation.mutate({
  first_name: form.first_name,
  last_name: form.last_name,
  email: form.email,
  phone: form.phone,
  branding_id: form.branding_id,
  is_indeed: true,
});
```

### 4. Accept-Mutation - Indeed sendet jetzt Email UND SMS

Im `acceptMutation` (Zeile 156-181) wird der Indeed-Block erweitert, sodass zusaetzlich zur SMS auch eine E-Mail verschickt wird:

```typescript
if (app.is_indeed) {
  // Email senden (neu)
  await sendEmail({
    to: app.email,
    recipient_name: fullName,
    subject: "Ihre Bewerbung wurde angenommen",
    body_title: "Ihre Bewerbung wurde angenommen",
    body_lines: [
      `Sehr geehrte/r ${fullName},`,
      "wir freuen uns, Ihnen mitzuteilen, dass Ihre Bewerbung angenommen wurde.",
      "Bitte buchen Sie nun einen Termin fuer Ihr Bewerbungsgespraech.",
    ],
    button_text: "Termin buchen",
    button_url: interviewLink,
    branding_id: app.branding_id || null,
    event_type: "bewerbung_angenommen",
    metadata: { application_id: app.id },
  });

  // SMS senden (bestehend, unveraendert)
  // ... existing SMS logic ...
}
```

## Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `src/pages/admin/AdminBewerbungen.tsx` | Schema, UI, Submit-Payload, Accept-Mutation |

