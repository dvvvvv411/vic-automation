
# Erinnerungs-SMS und E-Mail bei Bewerbungsgespraechen + Branding-Telefonnummer

## Uebersicht

Neuer Aktions-Button (SMS-Symbol) in der Bewerbungsgespraeche-Tabelle, der eine Erinnerungs-SMS und -E-Mail an nicht erreichbare Bewerber sendet. Zusaetzlich wird ein Telefonnummer-Feld im Branding hinterlegt, das in der Nachricht verwendet wird.

## Aenderungen

### 1. Datenbank: Neue Spalte `phone` in `brandings`

Migration: `ALTER TABLE public.brandings ADD COLUMN phone text;`

### 2. Neue SMS-Vorlage in `sms_templates`

INSERT mit:
- `event_type`: `gespraech_erinnerung`
- `label`: `Bewerbungsgespräch Erinnerung`
- `message`: `Hallo {name}, Sie hatten einen Termin bei uns, waren aber leider nicht erreichbar. Bitte rufen Sie uns an: {telefon}.`
- Platzhalter: `{name}`, `{telefon}`
- Max. 160 Zeichen

### 3. Branding-Formular erweitern (`src/pages/admin/AdminBrandings.tsx`)

- Neues Feld `phone` im Schema (optional, max 20 Zeichen)
- Input-Feld "Telefonnummer" im Branding-Dialog (bei den Firmendaten, z.B. neben Domain/E-Mail)
- Im `initialForm` und `openEdit` beruecksichtigen

### 4. SMS-Vorlagen-Seite erweitern (`src/pages/admin/AdminSmsTemplates.tsx`)

- `PLACEHOLDER_INFO` um `gespraech_erinnerung: ["{name}", "{telefon}"]` ergaenzen

### 5. Neuer Button in Bewerbungsgespraeche (`src/pages/admin/AdminBewerbungsgespraeche.tsx`)

- Neuer Button mit `MessageSquare`-Icon neben den bestehenden Status-Buttons
- Bei Klick:
  1. Branding des Bewerbers laden (inkl. `phone` und `sms_sender_name`)
  2. SMS-Vorlage `gespraech_erinnerung` aus `sms_templates` laden
  3. Platzhalter `{name}` und `{telefon}` ersetzen
  4. `sendSms()` aufrufen mit Bewerber-Telefonnummer
  5. `sendEmail()` aufrufen mit gleichem Text (Betreff: "Erinnerung an Ihr Bewerbungsgespräch")
  6. Toast-Meldung bei Erfolg/Fehler
- Der Button ist nur aktiv wenn der Bewerber eine Telefonnummer hat

### Dateien

| Datei | Aenderung |
|-------|----------|
| Migration SQL | `phone`-Spalte in `brandings` + neue SMS-Vorlage |
| `src/pages/admin/AdminBrandings.tsx` | Telefonnummer-Feld im Formular |
| `src/pages/admin/AdminSmsTemplates.tsx` | Platzhalter-Info fuer neues Template |
| `src/pages/admin/AdminBewerbungsgespraeche.tsx` | SMS-Button + Sende-Logik (SMS + E-Mail) |
