

# Fix: Logo als CID-Inline-Attachment in E-Mails einbetten

## Problem

Das Logo wird aktuell als `data:image/png;base64,...` Data-URI direkt im HTML eingebettet. E-Mail-Clients (Gmail, Outlook, etc.) blockieren Data-URIs aus Sicherheitsgruenden. Im Browser funktioniert es, in echten E-Mails nicht.

## Loesung: CID-Embedding (Content-ID)

Der branchenuebliche Ansatz fuer Bilder in E-Mails: Das Bild wird als **Inline-Attachment** an die E-Mail angehaengt und im HTML ueber `src="cid:logo"` referenziert. Resend unterstuetzt das ueber die `attachments`-API.

## Aenderungen in `supabase/functions/send-email/index.ts`

### 1. `fetchLogoAsBase64` anpassen (Zeilen 22-38)

Statt eine Data-URI zurueckzugeben, werden **rohe Base64-Daten** und der **Content-Type** separat zurueckgegeben:

```typescript
async function fetchLogo(url: string): Promise<{ base64: string; contentType: string } | null> {
  // ... fetch, konvertieren ...
  return { base64, contentType };
}
```

### 2. `buildEmailHtml` anpassen (Zeile 66-68)

Das Logo-`<img>` verwendet jetzt `cid:logo` statt der Data-URI:

```html
<img src="cid:logo" alt="Firmenname" style="max-height:48px;max-width:180px;" />
```

Der Parameter `logoDataUri` wird zu `hasLogo: boolean`.

### 3. Resend API-Aufruf erweitern (Zeilen 188-200)

Das Logo wird als Inline-Attachment mitgeschickt. Resend erwartet dafuer ein `attachments`-Array mit `content` (Base64-String ohne Praefix) und `filename`:

```typescript
const payload: any = {
  from: `${fromName} <${fromEmail}>`,
  to: [to],
  subject,
  html,
};

if (logoData) {
  payload.attachments = [{
    content: logoData.base64,
    filename: "logo.png",
    content_type: logoData.contentType,
  }];
  payload.headers = {
    ...payload.headers,
  };
}
```

Hinweis: Resend unterstuetzt CID-Referenzen automatisch, wenn der `filename` im Attachment dem `cid:`-Wert im HTML entspricht.

### 4. Zwischenergebnis speichern

Statt `logoDataUri` wird das Ergebnis von `fetchLogo()` als Objekt gespeichert und sowohl an `buildEmailHtml` (fuer das `cid:`-Tag) als auch an den Resend-API-Aufruf (fuer das Attachment) weitergegeben.

## Betroffene Datei

| Datei | Aenderung |
|-------|-----------|
| `supabase/functions/send-email/index.ts` | fetchLogo-Rueckgabe, CID im HTML, Resend-Attachment |

## Ergebnis

- Logos werden in allen E-Mail-Clients korrekt angezeigt
- Keine externe URL sichtbar (kein Supabase-Link)
- Branchenueblicher Ansatz (CID-Embedding)

