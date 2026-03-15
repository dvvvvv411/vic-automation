

# Auftrags-Erstellung & Anhänge-System umbauen

## Überblick

Großes Feature mit mehreren Teilbereichen:
1. Auftragserstellung von Dialog auf mehrstufige Seitenansicht umbauen (4 Schritte)
2. Neue DB-Felder für Orders (Typ, Beschreibung, Arbeitsschritte, erforderliche Anhänge, Starter-Job)
3. Neues Anhänge-System (DB-Tabelle, Upload, Admin-Genehmigung)
4. Bewertungs-Freischaltung entfernen (immer eigenständig startbar)
5. Auftrags-Abschluss-Logik anpassen (Bewertung + Anhänge müssen genehmigt sein)

---

## 1. Datenbank-Änderungen

### Orders-Tabelle erweitern
```sql
ALTER TABLE orders
  ADD COLUMN description text,
  ADD COLUMN order_type text NOT NULL DEFAULT 'andere',
  ADD COLUMN estimated_hours text,
  ADD COLUMN is_starter_job boolean NOT NULL DEFAULT false,
  ADD COLUMN work_steps jsonb DEFAULT '[]',
  ADD COLUMN required_attachments jsonb DEFAULT '[]';
```

- `order_type`: 'bankdrop', 'exchanger', 'platzhalter', 'andere'
- `work_steps`: Array von `{title, description}` Objekten
- `required_attachments`: Array von `{title, description}` Objekten
- `is_starter_job`: Wird automatisch neuen Mitarbeitern zugewiesen

### Neue Tabelle: `order_attachments`
```sql
CREATE TABLE order_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES employment_contracts(id) ON DELETE CASCADE,
  attachment_index int NOT NULL,  -- welcher required_attachment Eintrag
  file_url text NOT NULL,
  file_name text,
  status text NOT NULL DEFAULT 'eingereicht',  -- eingereicht, genehmigt, abgelehnt
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
```

RLS-Policies analog zu `order_reviews`:
- Mitarbeiter: eigene lesen/einfügen
- Admins/Kunden: lesen, updaten (Status ändern)

### `order_number` Feld entfernen oder optional machen
Das aktuelle Pflichtfeld `order_number` wird optional, da die neuen Felder (Titel, Typ, Beschreibung) die Hauptidentifikation übernehmen.

---

## 2. Frontend: Auftragserstellung (4-Schritt-Wizard)

### Neuer Route-Aufbau
- `/admin/auftraege` → Liste (bestehend, leicht angepasst)
- `/admin/auftraege/neu` → Wizard für neuen Auftrag
- `/admin/auftraege/:id/bearbeiten` → Wizard zum Bearbeiten

### Wizard-Komponente (`AdminAuftragWizard.tsx`)
4 Schritte mit Tab-Navigation oben (wie in Screenshots):

**Schritt 1 - Grundinformationen:**
- Titel*, Beschreibung* (Textarea)
- Typ* (Select: Bankdrop, Exchanger, Platzhalter, Andere)
- Vergütung/Prämie*
- Geschätzte Stunden (optional)
- App Store URLs (2 Felder, optional)
- Toggle: Starter-Job für neue Mitarbeiter

**Schritt 2 - Arbeitsschritte:**
- Dynamische Liste von Schritten (Titel + Anweisung/Beschreibung)
- "+ Schritt hinzufügen" Button
- Entfernen-Button pro Schritt

**Schritt 3 - Bewertungsfragen:**
- Dynamische Liste von Fragen
- "+ Frage hinzufügen" Button
- Entfernen-Button pro Frage

**Schritt 4 - Erforderliche Anhänge:**
- Default: "Keine erforderlichen Anhänge definiert"
- "+ Anhang hinzufügen" Button
- Pro Anhang: Titel + Beschreibung
- Entfernen-Button pro Anhang

Navigation: Zurück/Weiter Buttons, letzter Schritt hat "Speichern"

---

## 3. Mitarbeiter-Panel: Anhänge-Upload

### `AuftragDetails.tsx` anpassen
- Arbeitsschritte anzeigen (nummerierte Cards)
- Wenn `required_attachments` vorhanden: Anhänge-Upload-Bereich
- Pro erforderlichem Anhang eine Upload-Card (Titel, Beschreibung, Datei-Upload)
- Akzeptierte Formate: PNG, JPG, JPEG, PDF
- Status pro Anhang anzeigen (eingereicht/genehmigt/abgelehnt)
- Upload geht in Storage-Bucket `order-attachments`

### Bewertung immer eigenständig startbar
- `review_unlocked` Check entfernen in `AuftragDetails.tsx`
- Bewertungs-Button immer anzeigen wenn `canReview` (status offen/fehlgeschlagen)
- Bewertung und Anhänge sind unabhängig voneinander einreichbar

### Auftrags-Abschluss-Logik
- Auftrag ist erst "erfolgreich" wenn:
  - Bewertung genehmigt UND
  - Alle erforderlichen Anhänge hochgeladen UND genehmigt
- Wenn keine Anhänge erforderlich: nur Bewertung nötig (wie bisher)

---

## 4. Admin-Panel: Anhänge-Verwaltung

### Neue Seite: `/admin/anhaenge` (`AdminAnhaenge.tsx`)
- Neuer Sidebar-Eintrag "Anhänge" unter "Bewertungen"
- Tabelle mit eingereichten Anhängen
- Spalten: Mitarbeiter, Auftrag, Anhang-Titel, Datei, Status, Eingereicht am
- Aktionen: Genehmigen / Ablehnen
- Branding-Filter wie andere Seiten

### `AdminMitarbeiterDetail.tsx` erweitern
- Im Aufträge-Tab: Spalte hinzufügen die zeigt ob Anhänge ausstehend sind
- Oder separater "Anhänge" Mini-Tab/Bereich

---

## 5. Bewertungs-Freischaltung entfernen

### `AuftragDetails.tsx`
- Zeile 540: `order.is_placeholder || reviewUnlocked` → einfach `true` (immer anzeigen)
- "Die Bewertung wird nach Freigabe..." Text entfernen

### `AdminMitarbeiterDetail.tsx`
- "Bewertung freischalten" Button/Logik entfernen (falls vorhanden)
- `review_unlocked` Feld wird nicht mehr genutzt

---

## Betroffene Dateien

### Neu erstellen:
- `supabase/migrations/...` — Schema-Änderungen
- `src/pages/admin/AdminAuftragWizard.tsx` — 4-Schritt Wizard
- `src/pages/admin/AdminAnhaenge.tsx` — Anhänge-Verwaltung

### Ändern:
- `src/App.tsx` — Neue Routen
- `src/components/admin/AdminSidebar.tsx` — Neuer Menüpunkt "Anhänge"
- `src/pages/admin/AdminAuftraege.tsx` — Liste anpassen, Dialog entfernen, Link zu Wizard
- `src/pages/mitarbeiter/AuftragDetails.tsx` — Arbeitsschritte, Anhänge-Upload, Bewertung immer freigeschalten
- `src/pages/mitarbeiter/Bewertung.tsx` — Abschluss-Logik anpassen
- `src/pages/admin/AdminMitarbeiterDetail.tsx` — Anhänge-Status anzeigen
- `src/integrations/supabase/types.ts` — wird automatisch aktualisiert

### Storage:
- Neuer Bucket `order-attachments` (public)

