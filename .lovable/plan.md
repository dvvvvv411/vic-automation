

# Docmosis Arbeitsvertrag-Generierung und digitale Unterschrift

## Ueberblick

Beim Genehmigen eines Arbeitsvertrags wird ueber Docmosis ein PDF generiert (ohne Unterschrift). Der Mitarbeiter sieht nach Login das PDF, kann digital unterschreiben, woraufhin ein zweites PDF mit Unterschrift generiert wird. Erst danach erhaelt er vollen Zugriff aufs Panel.

## Ablauf

```text
Admin genehmigt Vertrag
        |
        v
create-employee-account Edge Function
  -> Erstellt User-Account (wie bisher)
  -> Ruft intern generate-contract auf
     -> Waehlt Template nach employment_type
     -> Sendet JSON an Docmosis (mit weissem Bild als Platzhalter fuer VicUnterschrift)
     -> Speichert PDF in Storage "contract-documents"
     -> Setzt contract_pdf_url in DB
  -> Status = "genehmigt"
        |
        v
Mitarbeiter loggt sich ein
  -> MitarbeiterLayout prueft Status
  -> Status "genehmigt" -> zeigt ContractSigningView statt Panel
  -> PDF wird per iframe angezeigt
  -> Button "Vertrag unterschreiben" oeffnet Dialog
        |
        v
Unterschrift-Dialog
  -> HTML5 Canvas (Maus + Touch)
  -> Mitarbeiter schreibt Ort, Datum, Unterschrift
  -> Bestaetigung -> Canvas wird zu base64 PNG
        |
        v
sign-contract Edge Function
  -> Gleiche Daten + VicUnterschrift als "image:base64:..."
  -> Docmosis generiert finales PDF mit Unterschrift
  -> Speichert als signed_contract_pdf_url in Storage
  -> Status wird "unterzeichnet"
        |
        v
Mitarbeiter hat vollen Zugriff
  -> /mitarbeiter/meine-daten zeigt Download-Link fuer unterschriebenen Vertrag
```

## 1. Datenbank-Migration

Neue Spalten in `employment_contracts`:

| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| birth_place | text, nullable | Geburtsort |
| nationality | text, nullable | Nationalitaet |
| contract_pdf_url | text, nullable | URL des generierten PDFs (ohne Unterschrift) |
| signed_contract_pdf_url | text, nullable | URL des unterschriebenen PDFs |
| signature_data | text, nullable | base64-Bild der Unterschrift |

RPC-Funktion `submit_employment_contract` wird um `_birth_place` und `_nationality` Parameter erweitert.

## 2. Formular erweitern: src/pages/Arbeitsvertrag.tsx

Zwei neue Pflichtfelder in Step 0 (Persoenliche Informationen):
- **Geburtsort** (Textfeld)
- **Nationalitaet** (Select: Deutsch, Oesterreichisch, Schweizerisch, Sonstige)

Form-State, Validierung, Summary und RPC-Aufruf werden entsprechend angepasst.

## 3. Edge Function: generate-contract (NEU)

**Datei:** `supabase/functions/generate-contract/index.ts`

- Erwartet: `contract_id` im Body, Admin-Auth via Header
- Laedt Vertragsdaten + Branding aus DB (ueber application_id -> branding_id)
- Waehlt Template:
  - `minijob` -> `Arbeitsvertrag_Vorlage_Minijob.docx`
  - `teilzeit` -> `Arbeitsvertrag_Vorlage_Teilzeit.docx`
  - `vollzeit` -> `Arbeitsvertrag_Vorlage_Vollzeit.docx`
- Baut JSON fuer Docmosis zusammen (alle geforderten Felder)
- VicUnterschrift: sendet ein 1x1 weisses PNG als base64 Platzhalter
- POST an `https://eu1.dws4.docmosis.com/api/render`
- Speichert PDF-Response in Supabase Storage `contract-documents`
- Aktualisiert `contract_pdf_url` in der DB

## 4. create-employee-account anpassen

Nach erfolgreicher Genehmigung wird `generate-contract` intern per fetch aufgerufen (gleicher Auth-Token), damit beides in einem Schritt passiert.

## 5. Edge Function: sign-contract (NEU)

**Datei:** `supabase/functions/sign-contract/index.ts`

- Erwartet: `contract_id` + `signature_data` (base64), User-Auth
- Prueft ob Vertrag dem User gehoert und Status = "genehmigt"
- Laedt Vertragsdaten + Branding erneut
- Baut gleiche Docmosis-JSON, aber mit `VicUnterschrift` als `image:base64:{signature_data}`
- POST an Docmosis -> PDF
- Speichert in Storage als `signed_{contract_id}.pdf`
- DB-Update: `signed_contract_pdf_url`, `signature_data`, `status = 'unterzeichnet'`

## 6. Zugangssteuerung: src/components/mitarbeiter/MitarbeiterLayout.tsx

- Contract-Fetch erweitern um `status`, `contract_pdf_url`, `signed_contract_pdf_url`
- Wenn `status === 'genehmigt'`: ContractSigningView rendern statt Outlet
- Wenn `status === 'unterzeichnet'`: normales Panel mit Outlet

## 7. Neue Komponente: src/components/mitarbeiter/ContractSigningView.tsx

- Zeigt das PDF (`contract_pdf_url`) per `<iframe>` an
- Button "Vertrag unterschreiben" oeffnet Dialog
- Dialog enthaelt HTML5 Canvas (Touch + Maus Support)
- "Loeschen" Button zum Zuruecksetzen
- Bei Bestaetigung: Canvas -> base64 PNG -> ruft `sign-contract` Edge Function auf
- Bei Erfolg: Seite neu laden

## 8. Admin-Status-Badge: src/pages/admin/AdminArbeitsvertraege.tsx

- `statusBadge` Funktion um Case `unterzeichnet` erweitern (blaues Badge)

## 9. Vertrags-Download: src/pages/mitarbeiter/MeineDaten.tsx

- Neue Card-Sektion "Arbeitsvertrag" mit Download-Button
- Zeigt `signed_contract_pdf_url` aus Contract-Daten
- Contract-Fetch muss `signed_contract_pdf_url` mitliefern (ueber Layout-Context oder separater Fetch)

## 10. Config: supabase/config.toml

Neue Eintraege:
```text
[functions.generate-contract]
verify_jwt = false

[functions.sign-contract]
verify_jwt = false
```

## 11. Secret: DOCMOSIS_API_KEY

Muss als Supabase Secret hinterlegt werden bevor die Edge Functions funktionieren.

## Zusammenfassung der Dateien

| Datei | Aenderung |
|-------|-----------|
| DB Migration | 5 neue Spalten + RPC-Update |
| `supabase/functions/generate-contract/index.ts` | Neu |
| `supabase/functions/sign-contract/index.ts` | Neu |
| `supabase/functions/create-employee-account/index.ts` | Ruft generate-contract auf |
| `supabase/config.toml` | 2 neue Function-Eintraege |
| `src/pages/Arbeitsvertrag.tsx` | 2 neue Formularfelder + RPC-Anpassung |
| `src/components/mitarbeiter/MitarbeiterLayout.tsx` | Status-Check + ContractSigningView |
| `src/components/mitarbeiter/ContractSigningView.tsx` | Neu |
| `src/pages/admin/AdminArbeitsvertraege.tsx` | Neuer Status-Badge |
| `src/pages/mitarbeiter/MeineDaten.tsx` | Download-Sektion |

