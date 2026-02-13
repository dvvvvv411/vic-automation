

# Livechat System -- Crisp-Style

## Uebersicht

Ein Echtzeit-Livechat zwischen Admin und Mitarbeitern, inspiriert vom Crisp-Chat-Design. Fuer Mitarbeiter als schwebendes Popup (unten rechts), fuer Admins als vollstaendige Inbox-Seite unter `/admin/livechat`. Nachrichten werden ueber Supabase Realtime sofort zugestellt -- kein manuelles Neuladen noetig.

## 1. Datenbank

### Neue Tabelle: `chat_messages`

| Spalte | Typ | Pflicht | Default |
|---|---|---|---|
| id | uuid | ja | gen_random_uuid() |
| contract_id | uuid | ja | FK -> employment_contracts.id ON DELETE CASCADE |
| sender_role | text | ja | - (Werte: 'admin' oder 'user') |
| content | text | ja | - |
| created_at | timestamptz | ja | now() |
| read | boolean | ja | false |

- Index auf `(contract_id, created_at)` fuer schnelle Abfragen
- RLS-Policies:
  - Admins: SELECT, INSERT auf alle Nachrichten
  - Users: SELECT, INSERT nur auf eigene Nachrichten (WHERE contract_id in eigener employment_contract)
- UPDATE-Policy: Admins koennen `read` setzen; Users koennen `read` auf Nachrichten mit sender_role='admin' setzen

### Neue Tabelle: `chat_templates`

| Spalte | Typ | Pflicht | Default |
|---|---|---|---|
| id | uuid | ja | gen_random_uuid() |
| shortcode | text | ja | unique (z.B. "hallo") |
| content | text | ja | - |
| created_at | timestamptz | ja | now() |

- RLS: Nur Admins duerfen CRUD

### Supabase Realtime aktivieren

Realtime muss fuer die Tabelle `chat_messages` aktiviert werden (via `ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages`), damit neue Nachrichten sofort an alle verbundenen Clients gepusht werden.

## 2. Mitarbeiter-Seite: Chat-Popup (Crisp-Style)

### Komponente: `ChatWidget.tsx`

Wird in `MitarbeiterLayout.tsx` eingebunden und ist auf jeder `/mitarbeiter/*` Seite sichtbar.

### Design (Crisp-inspiriert)
- **Geschlossener Zustand**: Runder Button (56px) unten rechts mit Chat-Icon in Branding-Farbe, mit Puls-Animation bei ungelesenen Nachrichten und Unread-Badge
- **Geoeffneter Zustand**: Abgerundetes Panel (ca. 380px breit, 520px hoch) mit:
  - **Header**: Branding-Farbe als Hintergrund, "Support" Titel, Schliessen-Button
  - **Nachrichtenverlauf**: Scrollbare Liste, Admin-Nachrichten links (grauer Hintergrund), eigene Nachrichten rechts (Branding-Farbe), Zeitstempel unter jeder Nachricht, abgerundete Bubbles
  - **Eingabefeld**: Unten fixiert, Textarea mit Senden-Button, Enter zum Senden (Shift+Enter fuer Zeilenumbruch)
- **Animationen**: Sanftes Hoch-/Runterfahren via framer-motion (scale + opacity)

### Echtzeit
- Supabase Realtime Subscription auf `chat_messages` WHERE `contract_id = eigene_contract_id`
- Neue Nachrichten werden sofort zur Liste hinzugefuegt
- Auto-Scroll nach unten bei neuer Nachricht

### Sounds
- **Empfang**: Notification-Sound (kurzer "ding") wenn eine neue Admin-Nachricht reinkommt und das Widget geschlossen ist oder der Tab nicht fokussiert ist
- **Senden**: Kurzer "swoosh"-Sound beim Absenden einer eigenen Nachricht
- Sounds werden als Base64-kodierte Audio-Dateien direkt im Code eingebettet (kleine WAV/MP3-Snippets), damit keine externen Dateien noetig sind

### Unread-Badge
- Zaehlt ungelesene Nachrichten (read=false AND sender_role='admin')
- Badge auf dem Chat-Button wenn geschlossen
- Beim Oeffnen des Widgets werden alle ungelesenen als gelesen markiert (UPDATE read=true)

## 3. Admin-Seite: `/admin/livechat`

### Layout (Crisp Inbox-Style)

Dreispaltig auf Desktop, zweispaltig auf Tablet:

```text
+------------------+--------------------------------+
| Konversationen   |  Chat-Verlauf                  |
|                  |                                |
| [Suche...]       |  Header: Name + Branding       |
|                  |                                |
| Max Mustermann   |  Nachrichtenbubbles            |
|   Letzte Nachri..|  (gleich wie Mitarbeiter-Seite)|
|   vor 2 Min      |                                |
|                  |                                |
| Erika Muster     |  --------------------------    |
|   Hallo, ich...  |  [Eingabefeld mit Templates]   |
|   vor 15 Min     |                                |
+------------------+--------------------------------+
```

### Linke Spalte: Konversationsliste
- Alle Mitarbeiter mit mindestens einer Nachricht, sortiert nach letzter Nachricht
- Jeder Eintrag zeigt: Name, letzte Nachricht (gekuerzt), Zeitstempel, Unread-Badge
- Aktive Konversation hervorgehoben
- Suchfeld oben zum Filtern nach Name
- Echtzeit-Aktualisierung: Neue Nachrichten schieben die Konversation nach oben

### Rechte Spalte: Chat-Verlauf
- Selbes Bubble-Design wie beim Mitarbeiter
- Admin-Nachrichten rechts (Branding-Farbe), Mitarbeiter-Nachrichten links (grau)
- Eingabefeld unten mit Template-Trigger

### Template-System (nur Admin)

#### Trigger mit `!`
- Wenn der Admin `!` am Anfang der Eingabe tippt, erscheint ein Dropdown ueber dem Eingabefeld
- Das Dropdown filtert live waehrend des Tippens (z.B. `!hal` zeigt alle Templates die mit "hal" beginnen)
- Jeder Eintrag zeigt: Shortcode links, Vorschau des Textes rechts
- Klick oder Enter ersetzt den gesamten `!shortcode`-Text durch den Template-Inhalt
- Dropdown schliesst sich nach Auswahl

#### Variable Ersetzung
- Im Template-Text koennen Variablen wie `%vorname%` und `%nachname%` verwendet werden
- Beim Einfuegen werden diese automatisch durch die Daten des aktuell ausgewaehlten Mitarbeiters ersetzt (aus `employment_contracts`)
- Unterstuetzte Variablen: `%vorname%` (first_name), `%nachname%` (last_name)

#### Template-Verwaltung
- Kleiner Settings-Button im Chat-Header oder neben dem Eingabefeld
- Oeffnet einen Dialog zum Erstellen, Bearbeiten und Loeschen von Templates
- Felder: Shortcode (ohne !-Praefix) und Inhalt (Textarea)

### Echtzeit (Admin)
- Supabase Realtime Subscription auf `chat_messages` (alle Nachrichten, da Admin alle sehen darf)
- Neue Nachrichten aktualisieren sowohl die Konversationsliste als auch den aktiven Chat
- Kein Sound fuer den Admin (nur fuer Mitarbeiter)

## 4. Routing und Navigation

### AdminSidebar.tsx
- Neuer Eintrag "Livechat" mit `MessageCircle`-Icon und URL `/admin/livechat`
- Badge mit Anzahl ungelesener Nachrichten (ueber alle Konversationen)

### App.tsx
- Neue Route: `<Route path="livechat" element={<AdminLivechat />} />`

## 5. Dateien

| Datei | Typ | Beschreibung |
|---|---|---|
| Migration SQL | Neu | chat_messages + chat_templates Tabellen, RLS, Realtime |
| `src/components/chat/ChatWidget.tsx` | Neu | Mitarbeiter Popup-Widget (Crisp-Style) |
| `src/components/chat/ChatBubble.tsx` | Neu | Wiederverwendbare Nachrichtenbubble |
| `src/components/chat/ChatInput.tsx` | Neu | Eingabefeld mit Template-Dropdown (Admin) / einfach (User) |
| `src/components/chat/TemplateDropdown.tsx` | Neu | Dropdown fuer !-Trigger mit Live-Filterung |
| `src/components/chat/TemplateManager.tsx` | Neu | Dialog zur Template-Verwaltung (CRUD) |
| `src/components/chat/ConversationList.tsx` | Neu | Linke Spalte der Admin-Inbox |
| `src/components/chat/useChatRealtime.ts` | Neu | Hook fuer Supabase Realtime Subscription |
| `src/components/chat/useChatSounds.ts` | Neu | Hook fuer Notification- und Swoosh-Sounds |
| `src/pages/admin/AdminLivechat.tsx` | Neu | Admin Livechat Inbox-Seite |
| `src/components/mitarbeiter/MitarbeiterLayout.tsx` | Bearbeiten | ChatWidget einbinden |
| `src/components/admin/AdminSidebar.tsx` | Bearbeiten | Livechat Nav-Eintrag + Unread-Badge |
| `src/App.tsx` | Bearbeiten | Neue Route /admin/livechat |

## 6. Technische Details

### Supabase Realtime Integration
- Channel-Subscription auf `chat_messages` mit `postgres_changes` Event-Typ `INSERT`
- Mitarbeiter filtert auf `contract_id = eigene_id`
- Admin empfaengt alle INSERTs und aktualisiert den lokalen State
- Beim Unmount wird die Subscription sauber aufgeraeumt

### Sound-Implementierung
- Zwei kurze Audio-Clips werden als Base64-Strings im Code eingebettet
- `useChatSounds()` Hook gibt `playNotification()` und `playSend()` Funktionen zurueck
- Audio wird via `new Audio(dataUri).play()` abgespielt
- Notification-Sound nur wenn Widget geschlossen oder Tab nicht fokussiert

### Template-Dropdown Logik
- Input-Event-Handler prueft ob der Text mit `!` beginnt
- Wenn ja: Extrahiert den Suchbegriff nach `!` und filtert die Templates
- Templates werden via useQuery geladen und gecacht
- Variable Ersetzung geschieht client-seitig beim Einfuegen: `content.replace(/%vorname%/g, contract.first_name).replace(/%nachname%/g, contract.last_name)`

### Performance
- Nachrichten werden initial mit LIMIT 50 geladen, aeltere via "Mehr laden" Button
- Konversationsliste nutzt eine aggregierte Query (letzte Nachricht + Unread-Count pro contract_id)
- Realtime-Updates werden in den lokalen State gemergt statt komplette Queries auszuloesen

