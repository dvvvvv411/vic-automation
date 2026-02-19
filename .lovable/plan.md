

# Indeed-Bewerbungen, SMS mit Short-Links + neues SMS-Template

## Uebersicht

Vier zusammenhaengende Aenderungen:

1. **"Indeed Bewerbung" Toggle** im Popup -- reduziert Pflichtfelder auf Vorname, Nachname, Telefon, Branding
2. **Automatische SMS beim Akzeptieren** von Indeed-Bewerbern (statt E-Mail) mit Short-Link
3. **Link-Shortener** via DB-Tabelle `short_links` + Redirect-Route `/r/:code`
4. **Neues SMS-Template** `indeed_bewerbung_angenommen` in `/admin/sms` editierbar, getrennt vom normalen `bewerbung_angenommen`
5. **Short-Links auch beim bestehenden** `bewerbung_angenommen` SMS-Template verwenden

## Aenderungen im Detail

### 1. Datenbank-Migration

**Tabelle `applications` anpassen:**
- `email` von NOT NULL auf nullable aendern
- `employment_type` von NOT NULL auf nullable aendern
- Neue Spalte `is_indeed` (boolean, default false)

**Neue Tabelle `short_links`:**

| Spalte | Typ |
|--------|-----|
| id | uuid PK, default gen_random_uuid() |
| code | text, unique, not null |
| target_url | text, not null |
| created_at | timestamptz, default now() |

RLS: Alle koennen SELECT (fuer Redirect), Admins koennen INSERT.

**Neues SMS-Template einfuegen:**

```text
INSERT INTO sms_templates (event_type, label, message)
VALUES ('indeed_bewerbung_angenommen', 'Indeed Bewerbung angenommen',
  'Hallo {name}, vielen Dank fuer Ihre Bewerbung bei {unternehmen}, bitte buchen Sie ein Bewerbungsgespraech unter {link}.');
```

### 2. Link-Shortener

**Neue Datei `src/lib/createShortLink.ts`:**
- Generiert zufaelligen 6-stelligen alphanumerischen Code
- Speichert in `short_links` Tabelle
- Gibt Kurz-URL zurueck via `buildBrandingUrl(brandingId, "/r/" + code)`

**Neue Datei `src/pages/ShortRedirect.tsx`:**
- Liest Code aus URL-Parameter
- Laedt `target_url` aus `short_links` per Code
- Leitet via `window.location.href` weiter
- Zeigt "Weiterleitung..." waehrend des Ladens

**`src/App.tsx`:**
- Neue Route: `<Route path="/r/:code" element={<ShortRedirect />} />`

### 3. AdminBewerbungen.tsx

**Indeed-Toggle im Formular:**
- Neuer State `isIndeed` (boolean, default false)
- Switch-Komponente oben im Dialog: "Indeed Bewerbung"
- Wenn aktiv: E-Mail, Strasse, PLZ, Stadt, Anstellungsart werden ausgeblendet; Telefon wird Pflichtfeld mit Stern
- Zweites Zod-Schema `indeedSchema` mit nur: `first_name`, `last_name`, `phone` (required), `branding_id` (required uuid)
- `handleSubmit` waehlt Schema basierend auf `isIndeed`
- Payload setzt `is_indeed: true` bei Indeed-Bewerbungen

**Standard-Branding:**
- `initialForm.branding_id` wird auf `"47ef07da-e9ef-4433-9633-549d25e743ce"` (47skys GmbH) gesetzt

**Accept-Mutation anpassen (Zeilen 122-166):**
- Pruefen ob `app.is_indeed === true`
- Indeed-Bewerbungen: Keine E-Mail senden, stattdessen:
  1. Bewerbungsgespraech-Link generieren
  2. Short-Link erstellen via `createShortLink`
  3. SMS-Template `indeed_bewerbung_angenommen` laden
  4. Platzhalter ersetzen: `{name}`, `{unternehmen}`, `{link}` (Short-Link)
  5. SMS senden
- Normale Bewerbungen: Verhalten bleibt wie bisher, aber `{link}` im SMS-Template `bewerbung_angenommen` wird ebenfalls als Short-Link gesendet

**Reject-Mutation anpassen (Zeilen 168-196):**
- Indeed-Bewerbungen: Keine E-Mail senden, nur Status aendern (da kein Email vorhanden)

**Tabelle anpassen:**
- Indeed-Bewerber zeigen bei E-Mail "Indeed" statt leerer Zelle
- `employment_type` zeigt "–" wenn null

### 4. AdminSmsTemplates.tsx

**PLACEHOLDER_INFO erweitern:**
- Neuer Eintrag: `indeed_bewerbung_angenommen: ["{name}", "{unternehmen}", "{link}"]`

Das neue Template wird automatisch in der Liste angezeigt, da alle Templates aus der DB geladen werden.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| Migration (SQL) | email/employment_type nullable, is_indeed Spalte, short_links Tabelle + RLS, neues SMS-Template |
| `src/lib/createShortLink.ts` (neu) | Short-Link Hilfsfunktion |
| `src/pages/ShortRedirect.tsx` (neu) | Redirect-Seite |
| `src/App.tsx` | Route `/r/:code` |
| `src/pages/admin/AdminBewerbungen.tsx` | Indeed-Toggle, Standard-Branding, Accept/Reject Logik |
| `src/pages/admin/AdminSmsTemplates.tsx` | PLACEHOLDER_INFO fuer neues Template |

## SMS-Texte

**Indeed Bewerbung angenommen** (neues Template, editierbar unter /admin/sms):
```text
Hallo Max Mustermann, vielen Dank fuer Ihre Bewerbung bei 47skys GmbH, bitte buchen Sie ein Bewerbungsgespraech unter https://web.47-skys.de/r/a3f9x.
```

**Bewerbung angenommen** (bestehendes Template, {link} wird jetzt auch als Short-Link gesendet):
```text
Hallo Max Mustermann, Ihre Bewerbung wurde angenommen! Bitte buchen Sie Ihren Termin: https://web.47-skys.de/r/b7k2m
```

