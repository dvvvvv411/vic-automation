

# Mitarbeiter-Detailseite `/admin/mitarbeiter/:id`

## Übersicht

Neue Detailseite für jeden Mitarbeiter im Admin-Panel, erreichbar über einen "Details"-Button in der Mitarbeiter-Tabelle. Die Seite zeigt alle relevanten Informationen auf einen Blick.

## Änderungen

### 1. Neue Route in `src/App.tsx`
- `<Route path="mitarbeiter/:id" element={<AdminMitarbeiterDetail />} />` unter den Admin-Routen hinzufügen

### 2. "Details"-Button in `src/pages/admin/AdminMitarbeiter.tsx`
- Neue Spalte "Details" mit einem Button/Link pro Zeile, der zu `/admin/mitarbeiter/{contract.id}` navigiert (via `useNavigate`)

### 3. Neue Seite `src/pages/admin/AdminMitarbeiterDetail.tsx`
Lädt den Vertrag per `useParams().id` und zeigt folgende Sektionen:

**Header**: Name, Status-Badge, Branding + Quick-Buttons:
- "Zum Livechat" → navigiert zu `/admin/livechat` (mit contract_id als State/Query, damit der Chat direkt ausgewählt wird)
- "Auftrag zuweisen" → öffnet den bestehenden `AssignmentDialog` im `contract`-Modus
- "Genehmigen" → nur wenn Status "eingereicht", gleiche Logik wie in AdminArbeitsvertraege (Startdatum-Dialog + Edge Function Call)
- "Sperren/Entsperren" → gleiche Logik wie in AdminMitarbeiter

**Persönliche Daten** (aus `employment_contracts`):
- Alle Felder wie im Arbeitsverträge-Detaildialog: Name, Geburtsdatum, Geburtsort, Nationalität, Adresse, Familienstand, Beschäftigungsart, Startdatum, SV-Nr, Steuer-ID, Krankenkasse, IBAN/BIC/Bank
- Personalausweis-Bilder (Vorder-/Rückseite) mit Klick-Vorschau

**Aufträge** (aus `order_assignments` + `orders`):
- Tabelle: Auftragsnummer, Titel, Anbieter, Prämie, Status (Badge), Termin (aus `order_appointments`)

**Bewertungen** (aus `order_reviews` + `orders`):
- Gruppiert nach Auftrag mit Durchschnittsbewertung, einzelne Fragen/Ratings/Kommentare aufklappbar

### 4. Livechat-Integration
- Der "Zum Livechat"-Button navigiert zu `/admin/livechat?contract={id}`, und in `AdminLivechat.tsx` wird beim Mount der Query-Parameter gelesen, um den Chat direkt auszuwählen

## Dateien
- `src/App.tsx` — neue Route
- `src/pages/admin/AdminMitarbeiter.tsx` — Details-Button hinzufügen
- `src/pages/admin/AdminMitarbeiterDetail.tsx` — neue Datei
- `src/pages/admin/AdminLivechat.tsx` — Query-Parameter für auto-select Contract

