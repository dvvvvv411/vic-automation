
# Livechat Upgrade: Variablen-Fix, Profilbilder, Typing-Indicator & Echtzeit-Vorschau

## Uebersicht

Vier Verbesserungen am Livechat-System:
1. **Bug-Fix**: Template-Variablen case-insensitive machen (`%Vorname%` = `%vorname%`)
2. **Profilbilder**: Avatar-System fuer Admin und Mitarbeiter mit Upload-Funktion
3. **Admin-Anzeigename**: Admin kann seinen Namen setzen, der im Chat angezeigt wird
4. **Typing-Indicator & Echtzeit-Vorschau**: Mitarbeiter sieht "tippt...", Admin sieht was der Nutzer gerade schreibt

---

## 1. Bug-Fix: Template-Variablen

### Problem
In `ChatInput.tsx` Zeile 31-32 werden Variablen case-sensitive ersetzt (`%vorname%`), aber der Admin hat `%Vorname%` geschrieben.

### Loesung
Die Regex-Flags von `/g` auf `/gi` aendern (case-insensitive):

```
.replace(/%vorname%/gi, ...)
.replace(/%nachname%/gi, ...)
```

| Datei | Aenderung |
|---|---|
| `src/components/chat/ChatInput.tsx` | Regex-Flags auf `/gi` |

---

## 2. Profilbilder (Avatar-System)

### Datenbank

**Profiles-Tabelle erweitern** (existiert bereits mit `id`, `full_name`, `created_at`):

| Spalte | Typ | Default |
|---|---|---|
| avatar_url | text | NULL |
| display_name | text | NULL |

**Neuer Storage-Bucket**: `avatars` (public)

RLS fuer `avatars`-Bucket:
- Jeder authentifizierte User darf in seinen eigenen Ordner (`user_id/`) hochladen und ueberschreiben
- Oeffentliches Lesen (public bucket)

RLS fuer profiles UPDATE: Bereits vorhanden (`auth.uid() = id`)

### Default-Avatar
Kein externes Bild -- stattdessen wird bei fehlendem `avatar_url` ein farbiger Kreis mit den Initialen angezeigt (wie bei Crisp/Slack). Die Farbe wird aus dem Nutzernamen deterministisch generiert.

### Mitarbeiter-Widget: Avatar im Header
- Im Chat-Widget-Header: Neben dem X-Button wird der Mitarbeiter-Avatar angezeigt (klein, 32px, rund)
- Klick darauf oeffnet einen kleinen Dialog/Popover zum Bild-Upload
- Upload geht in den `avatars`-Bucket unter `{user_id}/avatar.png`
- Nach Upload wird `profiles.avatar_url` aktualisiert

### Admin-Livechat: Profilbild + Anzeigename
- Im Chat-Header (rechts oben bei `/admin/livechat`) wird ein kleiner Avatar des aktuellen Admins angezeigt
- Klick darauf oeffnet einen Dialog mit:
  - Avatar-Upload (gleicher Mechanismus wie Mitarbeiter)
  - Anzeigename-Feld (wird in `profiles.display_name` gespeichert)
- Der Admin-Anzeigename wird in der Chat-Bubble des Admins angezeigt (kleiner Name ueber der Nachricht)

### Chat-Bubbles mit Avataren
- `ChatBubble.tsx` erhaelt optionale Props: `avatarUrl`, `senderName`
- Bei Nachrichten der Gegenseite wird ein kleiner Avatar (24px) neben der Bubble angezeigt
- Beim Admin (im Mitarbeiter-Widget): Avatar + Anzeigename ueber der Bubble
- Beim Mitarbeiter (im Admin-Panel): Avatar + Name ueber der Bubble

---

## 3. Typing-Indicator & Echtzeit-Vorschau

### Mechanismus: Supabase Realtime Broadcast
Statt Datenbank-Eintraege zu schreiben wird der Supabase Realtime **Broadcast**-Kanal verwendet. Damit werden fluechtige Events (Typing-Status, Draft-Text) direkt an verbundene Clients gesendet -- ohne Datenbankschreibvorgaenge.

### Typing-Indicator (Mitarbeiter sieht "Admin tippt...")
- Wenn der Admin im Eingabefeld tippt, sendet er alle 2 Sekunden ein Broadcast-Event `typing` an den Kanal `chat-typing-{contract_id}`
- Der Mitarbeiter empfaengt das Event und zeigt eine animierte "tippt..."-Anzeige (drei pulsierende Punkte) unter der letzten Nachricht
- Nach 3 Sekunden ohne neues Event verschwindet der Indicator

### Echtzeit-Vorschau (Admin sieht Nutzer-Eingabe)
- Wenn der Mitarbeiter im Eingabefeld tippt, sendet er per Broadcast den aktuellen Input-Text (gedrosselt auf max alle 500ms) an `chat-typing-{contract_id}`
- Der Admin empfaengt den Draft-Text und zeigt ihn als grauen, kursiven Text unterhalb des Nachrichtenverlaufs an (aehnlich wie bei Crisp: "Benutzer schreibt: ...")
- Wenn der Text leer wird oder 3 Sekunden kein Update kommt, verschwindet die Vorschau

### Neuer Hook: `useChatTyping.ts`

```text
useChatTyping({ contractId, role }) => {
  // Sendet eigenen Typing-Status / Draft-Text
  sendTyping(draftText?: string): void
  
  // Empfaengt Typing-Status der Gegenseite
  isTyping: boolean           // Gegenseite tippt
  draftPreview: string | null // Nur fuer Admin: Was der Nutzer gerade schreibt
}
```

---

## 4. Dateien-Uebersicht

| Datei | Aenderung |
|---|---|
| Migration SQL | `profiles` erweitern (avatar_url, display_name), Storage-Bucket `avatars` erstellen mit RLS |
| `src/components/chat/ChatInput.tsx` | Regex `/gi` fuer Variablen; Typing-Broadcast senden |
| `src/components/chat/ChatBubble.tsx` | Avatar + Absendername anzeigen |
| `src/components/chat/ChatWidget.tsx` | Mitarbeiter-Avatar im Header mit Upload, Typing-Indicator anzeigen, Draft per Broadcast senden |
| `src/components/chat/useChatTyping.ts` | Neuer Hook fuer Broadcast-basiertes Typing/Draft |
| `src/components/chat/AvatarUpload.tsx` | Wiederverwendbare Komponente: Avatar anzeigen + Upload-Dialog |
| `src/pages/admin/AdminLivechat.tsx` | Admin-Avatar + Anzeigename im Header, Draft-Vorschau anzeigen, Typing-Broadcast senden |
| `src/components/chat/ConversationList.tsx` | Mitarbeiter-Avatar in der Liste anzeigen |

### Datenfluss Typing/Draft

```text
Mitarbeiter tippt -> Broadcast "draft" an chat-typing-{contract_id}
                  -> Admin empfaengt: zeigt Draft-Text kursiv an

Admin tippt       -> Broadcast "typing" an chat-typing-{contract_id}
                  -> Mitarbeiter empfaengt: zeigt "tippt..." Punkte-Animation
```

### Design-Details
- Typing-Indicator: Drei pulsierende Punkte in einer kleinen Bubble (links, grau), wie bei iMessage
- Draft-Vorschau (Admin): Unter dem Nachrichtenverlauf, kursiver grauer Text mit Bleistift-Icon
- Avatar-Upload: Klick auf Avatar oeffnet Popover mit Datei-Input und Vorschau
- Default-Avatar: Farbiger Kreis mit Initialen (deterministisch basierend auf Name)
