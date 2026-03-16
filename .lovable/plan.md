

# Video-Chat Verifizierung & Ident-System

## Übersicht
Komplettes Video-Ident-Feature: Neue Auftragsoption "Videochat Verifizierung", mehrstufiger Auftragsablauf für Mitarbeiter, neues Admin-Modul "Idents" mit Echtzeit-Datenaustausch.

---

## 1. Datenbank-Änderungen

### `orders` Tabelle erweitern
```sql
ALTER TABLE orders ADD COLUMN is_videochat boolean NOT NULL DEFAULT false;
```

### Neue Tabelle `ident_sessions`
```sql
CREATE TABLE ident_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  contract_id uuid NOT NULL REFERENCES employment_contracts(id),
  assignment_id uuid NOT NULL REFERENCES order_assignments(id),
  status text NOT NULL DEFAULT 'waiting', -- waiting, data_sent, completed, cancelled
  phone_api_url text,
  test_data jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  branding_id uuid
);
ALTER TABLE ident_sessions ENABLE ROW LEVEL SECURITY;
-- RLS: Admins/Kunden full access, Users can read own (by contract_id)
```

`test_data` Format: `[{ "label": "Identcode", "value": "123456" }, { "label": "Passwort", "value": "abc" }]`

---

## 2. Admin Auftrag-Wizard (`AdminAuftragWizard.tsx`)

- Add `is_videochat` to form state (default `false`)
- Add Switch toggle on Step 1 (Grundinformationen), similar to `is_starter_job`:
  - Label: "Video-Chat Verifizierung aktivieren"
  - Description: "Mitarbeiter müssen vor der Bewertung eine Video-Chat Verifizierung durchführen."
- Include `is_videochat` in save payload

---

## 3. Auftragsdetails-Seite komplett umbauen (`AuftragDetails.tsx`)

### Mehrstufiger Flow mit internem Step-State:

**Step 1 - Übersicht**: Titel, Beschreibung, Typ-Badge, Prämie. Button "Auftrag starten"

**Step 2 - Vorbereitung**: Downloads Card + Arbeitsschritte Card. Button "Auftrag starten" (startet den eigentlichen Prozess)

**Step 3a - Video-Chat Disclaimer** (nur wenn `is_videochat`):
- Video-Icon, Titel "Möchtest du den Video-Chat durchführen?"
- Infotext + Hinweise (wie im Screenshot)
- Button "Einverstanden, ich möchte am Video-Chat teilnehmen"
- Erstellt `ident_session` mit Status `waiting`

**Step 3b - Video-Ident Warteseite** (nur wenn `is_videochat`):
- Split-Layout: Links "SMS Nachrichten" (leer bis Telefonnummer zugewiesen), Rechts "Test-Daten" mit Loading-Spinner
- Texte wie im Screenshot: "Deine Test-Daten werden vorbereitet", "Das kann bis zu 3 Stunden dauern..."
- Info-Boxen: "Was passiert als nächstes?" und "Keine Daten nach einigen Stunden?"
- **Realtime-Subscription** auf `ident_sessions` für Updates
- Sobald `test_data` und `phone_api_url` gesetzt → Daten anzeigen + SMS via Anosim-Proxy laden
- Button "Videochat erfolgreich beendet" → Bestätigungs-Dialog → weiter zu Bewertung

**Step 4 - Bewertungsfragen**: Bestehende Bewertungslogik (inline oder Navigation zu `/mitarbeiter/bewertung/:id`). Nach Absenden → Status `in_pruefung`

**Step 5 - Erforderliche Anhänge** (wenn vorhanden):
- Bestehende Anhänge-UI
- Neuer Button "Später hinzufügen" → markiert Auftrag als "Anhänge ausstehend"
- User kann jederzeit zurückkehren und Anhänge hochladen

---

## 4. Neues Admin-Modul "Idents" (`AdminIdents.tsx`)

### Sidebar
- Neuer Eintrag in "Betrieb": `{ title: "Idents", url: "/admin/idents", icon: Video }`
- Badge-Count: Anzahl `ident_sessions` mit Status `waiting`

### Idents-Übersicht
- Card/Tabellen-Ansicht aller aktiven Ident-Sessions
- Anzeige: Mitarbeitername, Auftragsname, Status, Zeitstempel
- Echtzeit-Updates via Supabase Realtime

### Ident-Detail-Ansicht (Dialog oder Inline)
- **Telefonnummer**: Anosim-URL eingeben/auswählen (wie bei Telefonnummern-Modul)
- **SMS-Anzeige**: Sobald Telefonnummer zugewiesen, SMS live anzeigen (Anosim-Proxy)
- **Test-Daten Editor**: 
  - Standard-Felder als Dropdown: Identcode, Identlink, Anmeldename, Email, Passwort
  - "+" Button für weitere benutzerdefinierte Felder (Label + Value)
  - Nicht ausgefüllte Felder werden nicht an den User gesendet
- **Speichern** → Update `ident_sessions` → User sieht Daten sofort (Realtime)
- **Button "SMS Watch beenden"** → setzt Status auf `completed` oder entfernt Telefonnummer

---

## 5. Routing (`App.tsx`)
- Import + Route: `<Route path="idents" element={<AdminIdents />} />`

---

## 6. Realtime-Synchronisation
- User-Seite: `supabase.channel('ident-session-{id}').on('postgres_changes', ...)` auf `ident_sessions`
- Admin-Seite: Realtime-Subscription auf `ident_sessions` für neue Sessions

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| Migration | `orders.is_videochat` + `ident_sessions` Tabelle + RLS |
| `AdminAuftragWizard.tsx` | Video-Chat Toggle |
| `AuftragDetails.tsx` | Komplett umbauen: Multi-Step Flow |
| `AdminIdents.tsx` | **NEU** - Admin Ident-Verwaltung |
| `AdminSidebar.tsx` | Idents Nav-Eintrag + Badge |
| `App.tsx` | Route für Idents |

---

## Implementierungsreihenfolge
1. DB-Migration (orders + ident_sessions)
2. Admin Wizard: is_videochat Toggle
3. AuftragDetails: Multi-Step Flow
4. AdminIdents: Neue Seite
5. Sidebar + Routing
6. Realtime-Integration

