

# Bewerbungsformular Edge Function + Lebenslauf-Upload

## Uebersicht

Drei Aufgaben:
1. **Lebenslauf-Spalte** in der `applications`-Tabelle hinzufuegen + im Admin-Panel anzeigbar machen
2. **Edge Function `submit-application`** erstellen, die von der externen Landingpage aufgerufen wird
3. **Prompt fuer das Landingpage-Projekt** schreiben

---

## 1. Datenbank: Neue Spalte `resume_url`

Migration:
```sql
ALTER TABLE public.applications ADD COLUMN resume_url text;
```

Die PDF wird im bestehenden Storage-Bucket `contract-documents` gespeichert (oder ein neuer Bucket `application-documents`). Die Edge Function laedt die Datei hoch und speichert die oeffentliche URL in `resume_url`.

---

## 2. Storage: Neuer Bucket `application-documents`

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('application-documents', 'application-documents', true);

CREATE POLICY "Anyone can upload application documents"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'application-documents');

CREATE POLICY "Anyone can read application documents"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'application-documents');
```

---

## 3. Edge Function: `submit-application`

Datei: `supabase/functions/submit-application/index.ts`

- **Oeffentlich** (kein Auth noetig, wird von der Landingpage aufgerufen)
- Empfaengt `multipart/form-data` mit:
  - `first_name`, `last_name`, `email`, `phone`, `street`, `zip_code`, `city`, `employment_type`, `branding_id` (Text-Felder)
  - `resume` (PDF-Datei)
- Validierung der Pflichtfelder (first_name, last_name, email, employment_type)
- Validierung dass `branding_id` (falls angegeben) existiert
- PDF wird in den Storage-Bucket `application-documents` hochgeladen
- Bewerbung wird in `applications`-Tabelle eingefuegt mit `resume_url`
- Gibt `{ success: true, application_id }` zurueck

Config-Ergaenzung in `supabase/config.toml`:
```toml
[functions.submit-application]
verify_jwt = false
```

---

## 4. Admin-Panel: Lebenslauf anzeigen (AdminBewerbungen.tsx)

- **Details-Dialog** hinzufuegen: Klick auf eine Tabellenzeile oeffnet ein Dialog-Popup mit allen Bewerbungsdaten
- Im Dialog wird der Lebenslauf als PDF-Link angezeigt (Button "Lebenslauf ansehen" der die PDF in einem neuen Tab oeffnet)
- In der Tabelle: neue Spalte "Lebenslauf" mit einem kleinen PDF-Icon/Link falls vorhanden

---

## 5. Prompt fuer das Landingpage-Projekt

Am Ende wird ein fertiger Copy-Paste-Prompt generiert, den du in deinem anderen Lovable-Projekt einfuegen kannst. Dieser beschreibt:
- Die Formularfelder (Vorname, Nachname, Email, Telefon, Strasse, PLZ, Stadt, Anstellungsart, Lebenslauf-Upload)
- Die `branding_id` als URL-Parameter oder Prop
- Den `fetch`-Aufruf an die Edge Function mit `multipart/form-data`
- Die exakte URL: `https://luorlnagxpsibarcygjm.supabase.co/functions/v1/submit-application`

---

## Technische Details

### Edge Function Code-Struktur

```text
1. Parse multipart/form-data
2. Validiere Pflichtfelder
3. Falls resume vorhanden:
   a. Pruefe Dateityp (nur PDF)
   b. Upload nach storage: application-documents/{uuid}.pdf
   c. Generiere public URL
4. Insert in applications-Tabelle
5. Return { success: true, application_id }
```

### Admin-Panel Aenderungen

```text
AdminBewerbungen.tsx:
- State fuer selectedApplication hinzufuegen
- Details-Dialog mit allen Feldern
- Lebenslauf-Button: <a href={resume_url} target="_blank">
- Neue Tabellenspalte "CV" mit FileText-Icon
```

### Betroffene Dateien

1. `supabase/functions/submit-application/index.ts` (NEU)
2. `supabase/config.toml` (erweitern)
3. `src/pages/admin/AdminBewerbungen.tsx` (Details-Dialog + CV-Spalte)
4. Datenbank-Migration: `resume_url`-Spalte + Storage-Bucket

