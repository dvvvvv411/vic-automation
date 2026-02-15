

# Auftragstermine: Terminbuchung fuer Nicht-Platzhalter-Auftraege

## Uebersicht

Platzhalter-Auftraege funktionieren weiterhin wie bisher. Nicht-Platzhalter-Auftraege erfordern kuenftig eine Terminbuchung. Der Mitarbeiter bucht Tag und Uhrzeit (ohne Slot-Limit), erhaelt den Hinweis, dass der Auftrag im Livechat mit dem Ansprechpartner durchgefuehrt wird, und im Chat erscheint eine dezente Systemnachricht als Bestaetigung. Die Auftrags-Cards auf Dashboard und Auftraege-Seite zeigen den gebuchten Terminzeitpunkt an. Admins erhalten einen neuen Reiter "Auftragstermine".

---

## 1. Neue Datenbanktabelle: `order_appointments`

Migration erstellt:

- `id` (uuid, PK, default gen_random_uuid())
- `order_id` (uuid, FK -> orders)
- `contract_id` (uuid, FK -> employment_contracts)
- `appointment_date` (date)
- `appointment_time` (time)
- `created_at` (timestamptz, default now())

Keine Unique-Constraints -- beliebig viele Buchungen pro Slot erlaubt.

RLS-Policies:
- Admins: SELECT
- Mitarbeiter: SELECT + INSERT auf eigene `contract_id`

## 2. Systemnachricht im Chat

### 2a. Typ erweitern

**Datei**: `src/components/chat/useChatRealtime.ts`
- `sender_role` Typ wird auf `"admin" | "user" | "system"` erweitert

### 2b. SystemMessage-Komponente

**Datei**: `src/components/chat/ChatBubble.tsx`
- Neuer Export `SystemMessage` -- dezentes, zentriertes Element (aehnlich `DateSeparator`), mit kleinem CalendarCheck-Icon und hellgrauem Hintergrund-Pill
- Beispiel: "Auftragstermin gebucht: 'Auftragstitel' am 15. Februar 2026 um 14:00 Uhr"

### 2c. Rendering im ChatWidget

**Datei**: `src/components/chat/ChatWidget.tsx`
- System-Nachrichten (`sender_role === "system"`) werden als `SystemMessage` gerendert statt als `ChatBubble`

## 3. Terminbuchungs-Flow fuer Mitarbeiter

### 3a. AuftragDetails-Seite

**Datei**: `src/pages/mitarbeiter/AuftragDetails.tsx`

Fuer Nicht-Platzhalter-Auftraege (wenn `!order.is_placeholder`):
- Statt Bewertungsfragen und "Bewertung starten"-Button wird eine Terminbuchungs-Sektion angezeigt
- Hinweistext: "Dieser Auftrag wird gemeinsam mit Ihrem Ansprechpartner im Livechat durchgefuehrt. Bitte buchen Sie einen Termin."
- Kalender + Zeitslot-Auswahl (gleiches Pattern wie `Bewerbungsgespraech.tsx`)
- 30-Minuten-Slots von 08:00 bis 18:00, vergangene Zeiten am aktuellen Tag ausgefiltert
- Keine Slot-Limits (alle Zeiten immer buchbar)
- Wenn bereits ein Termin gebucht: Bestaetigungsansicht mit Datum/Uhrzeit
- Nach Buchung: System-Nachricht wird in `chat_messages` eingefuegt:

```text
sender_role: "system"
content: "Auftragstermin gebucht: „[Titel]" am [Datum] um [Uhrzeit] Uhr. Der Auftrag wird im Livechat durchgeführt."
```

### 3b. Auftrags-Cards mit Terminanzeige

**Dateien**: `src/pages/mitarbeiter/MitarbeiterDashboard.tsx`, `src/pages/mitarbeiter/MitarbeiterAuftraege.tsx`

- `is_placeholder` wird beim Laden der Orders mit abgefragt (Dashboard hat es bereits, Auftraege-Seite muss erweitert werden)
- Bestehende Termine aus `order_appointments` werden fuer die eigene `contract_id` geladen
- Bei Nicht-Platzhalter-Auftraegen im Status "offen":
  - Ohne Termin: Button zeigt "Termin buchen" statt "Auftrag starten"
  - Mit Termin: Badge mit CalendarCheck-Icon + "Termin: [Datum], [Uhrzeit] Uhr" auf der Card
- `StatusButton`-Komponente wird um die `is_placeholder`-Logik erweitert

## 4. Admin: Neuer Reiter "Auftragstermine"

### 4a. Neue Seite

**Neue Datei**: `src/pages/admin/AdminAuftragstermine.tsx`

Tabellarische Uebersicht (gleiches Layout wie `AdminBewerbungsgespraeche.tsx`):
- Spalten: Datum, Uhrzeit, Mitarbeiter (first_name + last_name aus employment_contracts), Auftrag (Titel + Nummer aus orders)
- Sortierung: naechster Termin oben
- Filterbuttons: Heute/Morgen (default), Vergangene, Zukuenftige
- Pagination (20 pro Seite)

### 4b. Admin-Sidebar

**Datei**: `src/components/admin/AdminSidebar.tsx`
- Neuer Nav-Item "Auftragstermine" mit `CalendarClock`-Icon, positioniert zwischen "Auftraege" und "Livechat"
- Badge mit Anzahl heutiger Termine

### 4c. Route

**Datei**: `src/App.tsx`
- Import + Route: `/admin/auftragstermine` -> `AdminAuftragstermine`

## 5. Zusammenfassung aller Aenderungen

| Datei | Aenderung |
|---|---|
| Migration (neu) | Tabelle `order_appointments` + RLS |
| `useChatRealtime.ts` | `sender_role` Typ erweitern auf `"system"` |
| `ChatBubble.tsx` | Neuer `SystemMessage`-Export |
| `ChatWidget.tsx` | System-Nachrichten als `SystemMessage` rendern |
| `AuftragDetails.tsx` | Terminbuchung fuer Nicht-Platzhalter |
| `MitarbeiterAuftraege.tsx` | `is_placeholder` + Termine laden, Button-/Badge-Logik |
| `MitarbeiterDashboard.tsx` | Termine laden, Button-/Badge-Logik |
| `AdminAuftragstermine.tsx` (neu) | Admin-Termine-Uebersicht |
| `AdminSidebar.tsx` | Neuer Nav-Eintrag + Badge |
| `App.tsx` | Neue Route |

