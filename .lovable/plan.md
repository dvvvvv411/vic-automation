

# Plan: Vertragsvorlagen, Firmenunterschrift & neuer Vertrags-Flow

## Uebersicht

Komplette Ueberarbeitung des Vertragssystems: Admin verwaltet Vorlagen + Firmenunterschrift pro Branding, Mitarbeiter waehlt Vorlage, fuellt Daten aus, sieht Vorschau, unterschreibt digital. Admin genehmigt ohne Kontoerstellung. Vertrag wird client-seitig als PDF generiert (kein Docmosis).

---

## Datenbank-Aenderungen

### Neue Tabelle: `contract_templates`
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | uuid PK | |
| branding_id | uuid NOT NULL | Zugeordnetes Branding |
| title | text NOT NULL | z.B. "Arbeitsvertrag - Vollzeit" |
| employment_type | text NOT NULL | minijob/teilzeit/vollzeit |
| salary | numeric | Monatliches Gehalt |
| content | text NOT NULL | HTML-Vertragstext (Rich Text) |
| is_active | boolean DEFAULT true | Aktiv/Inaktiv |
| created_by | uuid | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLS: Admins/Kunden voll, Mitarbeiter SELECT auf eigene branding_id.

### Neue Spalten auf `brandings`
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| signature_image_url | text | URL des generierten/hochgeladenen Unterschriftbilds |
| signer_name | text | Name des Unterzeichners |
| signer_title | text | Titel (z.B. Geschaeftsfuehrer) |
| signature_font | text | Gewaehlter Font-Style |

### Neue Spalte auf `employment_contracts`
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| template_id | uuid | Gewaehlte Vertragsvorlage |
| contract_dismissed | boolean DEFAULT false | Ob der Mitarbeiter die "Genehmigt"-Card geschlossen hat |

---

## Neue npm-Pakete
- **@tiptap/react, @tiptap/starter-kit, @tiptap/extension-underline** - Rich Text Editor fuer Vertragstext
- **html2canvas + jspdf** - Client-seitige PDF-Generierung (kein Docmosis)

---

## Teil 1: Admin - Vertragsvorlagen Seite

### Neue Datei: `src/pages/admin/AdminVertragsvorlagen.tsx`
- Listenseite wie im Screenshot: Cards mit Titel, Kategorie-Badge (Aktiv), Anstellungsart, Version-Info, "Zuletzt bearbeitet"
- Icon-Buttons: Vorschau (Eye), Bearbeiten (Pencil), Duplizieren (Copy), Loeschen (Trash)
- Button `+ Neue Vorlage` navigiert zu `/admin/vertragsvorlagen/neu`
- **Firmenunterschrift-Sektion** darunter:
  - Aktuelle Unterschrift Preview (Bild aus `brandings.signature_image_url`)
  - Unterzeichner-Name + Titel rechts daneben
  - Buttons: Download, Loeschen, Hochladen (eigenes Bild)
  - Eingabefelder: "Name des Unterzeichners", "Titel des Unterzeichners"
  - Button "Neue Unterschrift generieren" oeffnet Popup

### Neue Datei: `src/pages/admin/AdminVertragsvorlageForm.tsx`
- Formularseite wie im Screenshot (Titel, Kategorie-Dropdown, Monatliches Gehalt)
- **TipTap Rich Text Editor** fuer Vertragstext mit Toolbar (Bold, Italic, Underline, Strikethrough, Listen, Alignment, Links)
- Hinweis: "Verwenden Sie Platzhalter im Format {{ variableName }}"
- Zurueck-Button, Speichern-Button
- Edit-Modus ueber `:id` Parameter

### Signature Generator Dialog
- Popup mit Name + Titel Eingabefeldern (vorausgefuellt)
- 4 Handwritten-Font-Previews: Elegant, Professional, Cursive, Bold
- Fonts: Dancing Script, Great Vibes, Pacifico, Satisfy (Google Fonts)
- Auswahl markiert mit rotem Rahmen
- "Unterschrift generieren" Button rendert den Namen mit gewaehltem Font auf ein Canvas, speichert als PNG in `branding-logos` Bucket

---

## Teil 2: Admin Sidebar + Routing

### `AdminSidebar.tsx`
- Neuer Eintrag unter Einstellungen: `{ title: "Vertragsvorlagen", url: "/admin/vertragsvorlagen", icon: FileText }`

### `App.tsx`
- Neue Routen:
  - `vertragsvorlagen` -> `AdminVertragsvorlagen`
  - `vertragsvorlagen/neu` -> `AdminVertragsvorlageForm`
  - `vertragsvorlagen/:id` -> `AdminVertragsvorlageForm`

---

## Teil 3: Mitarbeiter - Vorlagenauswahl + Vertragsflow

### `MitarbeiterArbeitsvertrag.tsx` ueberarbeiten
- **Neuer Step 0: Vorlagenauswahl** (vor den bisherigen Schritten)
  - Query auf `contract_templates` WHERE `branding_id` = Mitarbeiter-Branding AND `is_active = true`
  - Cards mit Titel, Anstellungsart, Gehalt, Vorschau des Vertragstexts (gekuerzt)
  - Nach Auswahl: `employment_type` und `template_id` werden gesetzt, weiter zu Dateneingabe
- **Bisherige Steps bleiben** (Persoenliche Daten, Steuer, Bank, Ausweis)
- **Neuer letzter Step: Vertragsvorschau**
  - HTML-Rendering des Vertragstexts mit eingesetzten Platzhaltern (Name, Adresse, Geburtsdatum etc.)
  - Firmenunterschrift-Bild unten
  - "Unterschreiben" Button oeffnet Canvas-Signature-Dialog (wie bestehend)
  - Nach Unterschrift: signature_data + template_id + alle Daten via RPC speichern, Status = "eingereicht"

---

## Teil 4: Admin - Genehmigung ohne Kontoerstellung

### `AdminArbeitsvertraege.tsx` aendern
- Genehmigen-Button ruft NICHT mehr `create-employee-account` auf
- Stattdessen: Direktes Update `employment_contracts.status = 'genehmigt'` via Supabase
- Kein Passwort-Toast mehr
- Query muss auch Contracts OHNE `application_id` (Selbstregistrierung) anzeigen

---

## Teil 5: Mitarbeiter - Dashboard Card nach Genehmigung

### `MitarbeiterDashboard.tsx` aendern
- Wenn `contract.status === 'genehmigt'` UND `!contract.contract_dismissed`:
  - Gruene Card "Arbeitsvertrag genehmigt" mit Schliessen-Button (X)
  - Klick auf X setzt `contract_dismissed = true`
- `MitarbeiterLayout.tsx`: ContractSigningView-Blockade entfernen (kein PDF-Signing mehr ueber diesen Weg)

---

## Teil 6: Meine Daten - Vertrag anzeigen

### `MeineDaten.tsx` aendern
- "Herunterladen" Button wird zu "Anzeigen"
- Klick oeffnet Dialog mit:
  - HTML-gerendertem Vertrag (aus Template + Daten + Firmenunterschrift + User-Unterschrift)
  - "Als PDF speichern" Button (client-seitig via html2canvas + jspdf)

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|----------|
| `AdminVertragsvorlagen.tsx` | **Neu** - Listenseite + Firmenunterschrift |
| `AdminVertragsvorlageForm.tsx` | **Neu** - Formular mit Rich Text Editor |
| `AdminSidebar.tsx` | Neuer Nav-Eintrag |
| `App.tsx` | Neue Routen |
| `MitarbeiterArbeitsvertrag.tsx` | Vorlagenauswahl + Vertragsvorschau + Signing |
| `MitarbeiterLayout.tsx` | ContractSigningView-Logik anpassen |
| `MitarbeiterDashboard.tsx` | Genehmigt-Card mit Dismiss |
| `AdminArbeitsvertraege.tsx` | Genehmigung ohne Account-Erstellung |
| `MeineDaten.tsx` | Vertrag anzeigen + PDF-Export |
| DB Migration | `contract_templates` Tabelle + brandings-Spalten + contracts-Spalten |

### Reihenfolge der Implementierung
1. DB Migration (Tabelle + Spalten)
2. Admin: Vertragsvorlagen + Form + Unterschrift-Generator
3. Mitarbeiter: Vorlagenauswahl + neuer Flow
4. Admin: Genehmigung ueberarbeiten
5. Mitarbeiter: Dashboard-Card + Meine Daten Viewer

