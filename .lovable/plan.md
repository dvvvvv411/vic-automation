

# Auftragstermine: Terminbuchung für Nicht-Platzhalter-Aufträge

## Übersicht

Nicht-Platzhalter-Aufträge erfordern künftig eine Terminbuchung, bevor der Mitarbeiter sie durchführen kann. Der Mitarbeiter bucht einen Termin (Tag + Uhrzeit, ohne Slot-Limit), erhält den Hinweis, dass der Auftrag im Livechat mit dem Ansprechpartner durchgeführt wird, und im Chat erscheint eine Systemnachricht als Bestätigung. Admins erhalten einen neuen Reiter "Auftragstermine" mit einer Übersicht aller gebuchten Termine.

---

## 1. Neue Datenbanktabelle: `order_appointments`

Migration erstellt eine neue Tabelle:

- `id` (uuid, PK)
- `order_id` (uuid, FK -> orders)
- `contract_id` (uuid, FK -> employment_contracts)
- `appointment_date` (date)
- `appointment_time` (time)
- `created_at` (timestamptz, default now())

RLS-Policies:
- Admins: voller Lesezugriff (SELECT)
- Mitarbeiter: SELECT + INSERT auf eigene `contract_id`
- Keine UPDATE/DELETE nötig

Wichtig: Keine Unique-Constraints auf Datum/Uhrzeit, da beliebig viele Buchungen pro Slot erlaubt sind.

## 2. Systemnachricht im Chat (neuer Nachrichtentyp)

**Datei**: `src/components/chat/ChatBubble.tsx`

Neuer Export `SystemMessage` -- ein dezentes, zentriertes Element (ähnlich dem `DateSeparator`), das z.B. so aussieht:

> Auftragstermin gebucht: "Auftragstitel" am 15. Februar 2026 um 14:00 Uhr

Styling: Zentrierter Text mit kleinem Icon, hellgrauer Hintergrund-Pill, kleiner Schrift -- kein Bubble-Stil.

**Datei**: `src/components/chat/ChatBubble.tsx` -- Erweiterung um `sender_role === "system"` Erkennung.

**Datei**: `src/components/chat/useChatRealtime.ts` -- `sender_role` Typ erweitern auf `"admin" | "user" | "system"`.

**Datei**: `src/components/chat/ChatWidget.tsx` -- System-Nachrichten im Chatverlauf als `SystemMessage` rendern statt als `ChatBubble`.

## 3. Terminbuchungs-Flow für Nicht-Platzhalter-Aufträge

### 3a. Auftrags-Cards (Dashboard + Aufträge-Seite)

**Dateien**: `src/pages/mitarbeiter/MitarbeiterDashboard.tsx`, `src/pages/mitarbeiter/MitarbeiterAuftraege.tsx`

- `is_placeholder` Feld wird beim Laden der Orders mit abgefragt
- Bei Nicht-Platzhalter-Aufträgen im Status "offen": Button zeigt "Termin buchen" statt "Auftrag starten"
- Bei Nicht-Platzhalter-Aufträgen mit bereits gebuchtem Termin: Badge "Termin gebucht" + Datum/Uhrzeit anzeigen

### 3b. AuftragDetails-Seite -- Terminbuchung integriert

**Datei**: `src/pages/mitarbeiter/AuftragDetails.tsx`

Für Nicht-Platzhalter-Aufträge:
- Statt der Bewertungsfragen und des "Bewertung starten"-Buttons wird eine Terminbuchungs-Komponente angezeigt
- Hinweistext: "Dieser Auftrag wird gemeinsam mit Ihrem Ansprechpartner im Livechat durchgeführt. Bitte buchen Sie einen Termin."
- Kalender + Zeitslot-Auswahl (wiederverwendbares Pattern aus `Bewerbungsgespraech.tsx`)
- Keine Slot-Limits: Jede Uhrzeit kann beliebig oft gebucht werden
- 30-Minuten-Slots von 08:00 bis 18:00
- Vergangene Zeiten am aktuellen Tag werden ausgefiltert
- Nach Buchung: Bestätigungsansicht + System-Nachricht wird in `chat_messages` geschrieben

### 3c. System-Nachricht nach Buchung

Nach erfolgreicher Terminbuchung wird in `chat_messages` eine Nachricht eingefügt:

```
sender_role: "system"
content: "Auftragstermin gebucht: „[Auftragstitel]" am [Datum] um [Uhrzeit] Uhr. Der Auftrag wird im Livechat durchgeführt."
```

## 4. Admin: Neuer Reiter "Auftragstermine"

### 4a. Neue Seite

**Neue Datei**: `src/pages/admin/AdminAuftragstermine.tsx`

Tabellarische Übersicht aller gebuchten Auftragstermine:
- Spalten: Datum, Uhrzeit, Mitarbeiter (Name aus employment_contracts), Auftrag (Titel + Nummer aus orders)
- Sortierung: nächster Termin oben
- Filterbuttons wie bei Bewerbungsgesprächen (Heute/Morgen, Vergangene, Zukünftige)
- Pagination (20 pro Seite)

### 4b. Admin-Sidebar erweitern

**Datei**: `src/components/admin/AdminSidebar.tsx`

- Neuer Nav-Item "Auftragstermine" mit `CalendarClock`-Icon zwischen "Aufträge" und "Livechat"
- Badge mit Anzahl heutiger Termine

### 4c. Route registrieren

**Datei**: `src/App.tsx`

- Import + Route: `/admin/auftragstermine` -> `AdminAuftragstermine`

## 5. Angepasste Dateien (Zusammenfassung)

| Datei | Änderung |
|---|---|
| Migration (neu) | Tabelle `order_appointments` + RLS |
| `src/components/chat/ChatBubble.tsx` | Neuer `SystemMessage`-Export |
| `src/components/chat/useChatRealtime.ts` | `sender_role` Typ erweitern |
| `src/components/chat/ChatWidget.tsx` | System-Nachrichten rendern |
| `src/pages/mitarbeiter/AuftragDetails.tsx` | Terminbuchung für Nicht-Platzhalter |
| `src/pages/mitarbeiter/MitarbeiterAuftraege.tsx` | `is_placeholder` laden, Button-Logik |
| `src/pages/mitarbeiter/MitarbeiterDashboard.tsx` | `is_placeholder` bereits vorhanden, Button-Logik |
| `src/pages/admin/AdminAuftragstermine.tsx` (neu) | Termine-Übersicht |
| `src/components/admin/AdminSidebar.tsx` | Neuer Nav-Eintrag + Badge |
| `src/App.tsx` | Neue Route |
| `src/integrations/supabase/types.ts` | Typ-Update nach Migration |

