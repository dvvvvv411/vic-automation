
# Badge mit Anstellungsart + Nachricht bearbeiten im Admin Livechat

## 1. Badge mit Anstellungsart im Chat-Header

Hinter dem Namen des Mitarbeiters wird ein farbiges Badge mit der Anstellungsart angezeigt (z.B. "Minijob", "Teilzeit", "Vollzeit").

### Aenderungen in `src/pages/admin/AdminLivechat.tsx`:
- `employment_type` zum Contract-Data-Fetch hinzufuegen (Zeile 135: `select("first_name, last_name, phone, user_id")` erweiternn um `employment_type`)
- `employment_type` im State-Typ ergaenzen
- Badge-Komponente aus `@/components/ui/badge` importieren
- Badge hinter dem Namen im Header einbauen (Zeile 356-360)

## 2. Nachrichten bearbeiten (nur Admin)

Admin kann eigene Nachrichten per Doppelklick oder Kontextmenue bearbeiten. Die Nachricht wird still aktualisiert -- der Mitarbeiter sieht nur den neuen Text, ohne Hinweis auf Aenderung.

### Aenderungen in `src/pages/admin/AdminLivechat.tsx`:
- Neue States: `editingMessageId` (string | null) und `editingMessageText` (string)
- Beim Hover ueber eine Admin-Nachricht ein kleines Stift-Icon anzeigen
- Beim Klick auf das Stift-Icon: `editingMessageId` und `editingMessageText` setzen
- Inline-Edit-Modus: Die Blase wird durch eine Textarea mit Speichern/Abbrechen ersetzt
- Beim Speichern: `supabase.from("chat_messages").update({ content: newText }).eq("id", msgId)` ausfuehren
- Die Realtime-Subscription in `useChatRealtime.ts` lauscht bereits auf UPDATE-Events (Zeile 67-79), daher aktualisiert sich die Nachricht automatisch auf beiden Seiten
- Kein "bearbeitet"-Hinweis, kein Verlauf, keine Benachrichtigung

### Aenderungen in `src/components/chat/ChatBubble.tsx`:
- Neue optionale Props: `onEdit`, `messageId`, `isEditing`, `editText`, `onEditChange`, `onEditSave`, `onEditCancel`
- Wenn `onEdit` vorhanden und `isOwnMessage`: Stift-Icon bei Hover einblenden
- Wenn `isEditing`: Textarea + Buttons statt normalem Text rendern

### Technische Details

```text
Header-Layout mit Badge:
[Avatar] [Name] [Badge: Minijob] | [Code-Input] [SMS] [+Auftrag] [Glocke] [Templates] [Profil]

Nachricht bearbeiten:
  - Hover ueber Admin-Blase -> Stift-Icon erscheint
  - Klick -> Blase wird zur Textarea
  - Enter (ohne Shift) oder Speichern-Button -> Update via Supabase
  - Escape oder Abbrechen -> Zurueck zur normalen Anzeige
  - Update geschieht leise (kein Toast, kein "bearbeitet"-Label)
```

Keine Datenbank-Aenderungen noetig. Die bestehende RLS-Policy erlaubt Admins bereits Updates auf `chat_messages`.
