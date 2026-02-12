

# Arbeitsvertraege-Modul: Admin-Seite + Bewerber-Formular

## Uebersicht

Es werden drei Hauptbereiche implementiert:

1. **Neue Admin-Seite** `/admin/arbeitsvertraege` -- Tabelle aller Bewerber mit erfolgreichem Bewerbungsgespraech
2. **Bewerber-Formular** `/arbeitsvertrag/:id` -- 4-Schritte-Formular fuer Arbeitsvertragsdaten (gleicher Stil wie `/bewerbungsgespraech/:id`)
3. **Neue Datenbanktabelle** `employment_contracts` -- speichert alle eingegebenen Daten + Status

---

## 1. Datenbank: Neue Tabelle `employment_contracts`

```sql
CREATE TABLE public.employment_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id),
  -- Persoenliche Informationen
  first_name text,
  last_name text,
  email text,
  phone text,
  birth_date date,
  street text,
  zip_code text,
  city text,
  marital_status text,
  employment_type text,
  desired_start_date date,
  -- Steuerliche Angaben
  social_security_number text,
  tax_id text,
  health_insurance text,
  -- Bankverbindung
  iban text,
  bic text,
  bank_name text,
  -- Ausweisdokumente
  id_front_url text,
  id_back_url text,
  -- Status & Timestamps
  status text NOT NULL DEFAULT 'offen',
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  UNIQUE(application_id)
);
```

Status-Werte: `offen` (angelegt, noch nicht ausgefuellt), `eingereicht` (Bewerber hat Formular abgeschickt), `genehmigt` (Admin hat genehmigt).

**Storage Bucket**: `contract-documents` (public) fuer Ausweisbilder.

**RLS-Policies**:
- Anon SELECT/UPDATE (fuer Bewerber-Formular)
- Admin SELECT/UPDATE/INSERT/DELETE

**Database Functions**:
- `submit_employment_contract(_contract_id uuid, ...)` -- SECURITY DEFINER, setzt alle Felder + Status auf `eingereicht`
- `approve_employment_contract(_contract_id uuid)` -- SECURITY DEFINER, setzt Status auf `genehmigt`

---

## 2. Admin-Seite: `/admin/arbeitsvertraege`

### Navigation
- Neuer Eintrag "Arbeitsvertraege" in `AdminSidebar.tsx` mit `FileCheck` Icon
- Neue Route in `App.tsx`: `<Route path="arbeitsvertraege" element={<AdminArbeitsvertraege />} />`

### Tabelle zeigt alle `interview_appointments` mit Status `erfolgreich`

| Spalte | Inhalt |
|---|---|
| Name | Vor- + Nachname aus applications |
| Telefon | Aus applications |
| E-Mail | Aus applications |
| Branding | Company name |
| Vertragsstatus | Badge: "Offen" (grau), "Daten eingereicht" (gelb), "Genehmigt" (gruen) |
| Aktionen | Bei "eingereicht": Button "Daten ansehen" oeffnet Dialog mit allen eingereichten Infos + "Genehmigen" Button |

### Dialog: Eingereichte Daten ansehen
- Zeigt alle Felder uebersichtlich gruppiert (Persoenlich, Steuer, Bank, Ausweise)
- Ausweisbilder als Thumbnails mit Klick zum Vergroessern
- "Genehmigen" Button ruft `approve_employment_contract` RPC auf

---

## 3. Bewerber-Formular: `/arbeitsvertrag/:id`

`id` = `application_id`. Die Seite laedt die Application-Daten + zugehoeriges Branding (Logo, Farbe) und zeigt das Formular im gleichen seriousen Stil wie die Bewerbungsgespraech-Seite.

### Vorausgefuellte Felder
Aus `applications`: first_name, last_name, email, phone, street, zip_code, city, employment_type

### 4-Schritte-Wizard

**Schritt 1: Persoenliche Informationen**
- Vorname, Nachname (vorausgefuellt)
- E-Mail (vorausgefuellt)
- Telefon (vorausgefuellt)
- Geburtsdatum (Datepicker, Vergangenheit)
- Strasse und Hausnummer (vorausgefuellt)
- PLZ und Stadt (vorausgefuellt)
- Familienstand (Dropdown: Ledig, Verheiratet, Geschieden, Verwitwet)
- Art der Beschaeftigung (Dropdown, vorausgefuellt: Minijob, Teilzeit, Vollzeit)
- Gewuenschtes Startdatum (Datepicker, nur Zukunft)

**Schritt 2: Steuerliche und sozialversicherungsrechtliche Angaben**
- Sozialversicherungsnummer (Platzhalter: "z.B. 12 010185 A 123")
- Steuerliche Identifikationsnummer (Platzhalter: "z.B. 12345678901")
- Krankenversicherung (Platzhalter: "z.B. AOK Bayern")

**Schritt 3: Bankverbindung fuer Gehaltsauszahlung**
- IBAN (Platzhalter: "DE89 3704 0044 0532 0130 00")
- BIC (Platzhalter: "COBADEFFXXX")
- Name der Bank (Platzhalter: "z.B. Commerzbank")

**Schritt 4: Ausweisdokumente**
- Ausweis Vorderseite (Datei-Upload mit Thumbnail-Vorschau)
- Ausweis Rueckseite (Datei-Upload mit Thumbnail-Vorschau)
- Upload geht in Supabase Storage Bucket `contract-documents`

### Zusammenfassung (Schritt 5)
- Alle eingegebenen Daten werden uebersichtlich angezeigt
- "Zurueck" Button um Daten zu korrigieren
- "Daten verbindlich einreichen" Button -- ruft RPC `submit_employment_contract` auf

### Nach Einreichung
- Bestaetigungsseite (wie bei Terminbuchung): Haekchen-Icon, "Ihre Daten wurden erfolgreich eingereicht."
- Bei erneutem Aufruf des Links wird direkt die Bestaetigungsseite gezeigt

### Design
- Logo + Branding-Farbe vom zugehoerigen Branding
- "Powered by {companyName}" Footer
- Serioeser, professioneller Stil -- kein verspieltes Design
- Schrittanzeige (Stepper) oben: 1 > 2 > 3 > 4 > Zusammenfassung
- Alle Felder sind Pflichtfelder (nur Ausfuell-Pflicht, keine Format-Validierung)

---

## 4. Workflow bei Status-Aenderung in Bewerbungsgespraeche

Wenn ein Admin ein Bewerbungsgespraech als "erfolgreich" markiert, wird automatisch ein `employment_contracts`-Eintrag mit Status `offen` angelegt (via Trigger oder im Frontend-Code nach dem RPC-Call). So erscheint der Eintrag sofort in `/admin/arbeitsvertraege`.

---

## Technische Details: Geaenderte/Neue Dateien

| Datei | Aenderung |
|---|---|
| Migration SQL | Neue Tabelle `employment_contracts`, Storage Bucket `contract-documents`, RLS-Policies, RPC-Funktionen, Trigger |
| `src/integrations/supabase/types.ts` | Wird automatisch aktualisiert |
| `src/App.tsx` | Neue Routen: `/admin/arbeitsvertraege`, `/arbeitsvertrag/:id` |
| `src/components/admin/AdminSidebar.tsx` | Neuer Navigationseintrag "Arbeitsvertraege" |
| `src/pages/admin/AdminArbeitsvertraege.tsx` | **NEU** -- Admin-Tabelle mit Daten-Dialog und Genehmigen-Funktion |
| `src/pages/Arbeitsvertrag.tsx` | **NEU** -- 4-Schritte-Formular fuer Bewerber |
| `src/pages/admin/AdminBewerbungsgespraeche.tsx` | Bei "erfolgreich" markieren auch `employment_contracts`-Eintrag anlegen |

