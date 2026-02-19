
# Chat-Anhaenge (Dateien & Bilder) im Livechat

## Uebersicht

Beide Chat-Ansichten (Admin-Livechat und Mitarbeiter-ChatWidget) erhalten einen "+" Button im Eingabefeld, ueber den Dateien (Bilder, PDFs etc.) ausgewaehlt und versendet werden koennen. Anhaenge werden im Supabase Storage Bucket gespeichert und als URL in der Nachricht hinterlegt.

## Aenderungen

### 1. Datenbank: Neue Spalte `attachment_url` in `chat_messages`

Eine neue nullable Spalte `attachment_url` (text) wird zur Tabelle `chat_messages` hinzugefuegt, um die URL der hochgeladenen Datei zu speichern.

### 2. Storage: Neuer Bucket `chat-attachments`

Ein neuer oeffentlicher Storage-Bucket `chat-attachments` wird erstellt mit passenden RLS-Policies:
- Admins koennen Dateien hochladen und lesen
- User koennen Dateien fuer eigene Contracts hochladen und alle lesen

### 3. ChatInput Komponente erweitern

Die `ChatInput`-Komponente bekommt:
- Einen "+" Button links neben dem Textfeld
- Ein verstecktes `<input type="file">` Element
- State fuer die ausgewaehlte Datei mit Vorschau (Dateiname + X zum Entfernen)
- Die `onSend`-Callback-Signatur wird erweitert um eine optionale Datei: `onSend(text, file?)`

### 4. ChatBubble erweitern

Die `ChatBubble`-Komponente zeigt Anhaenge an:
- Bilder (jpg, png, webp, gif): Inline als klickbares Vorschaubild
- PDFs/andere Dateien: Als Download-Link mit Dateiname und Icon

### 5. useChatRealtime erweitern

- `ChatMessage`-Interface bekommt `attachment_url?: string | null`
- `sendMessage` bekommt einen optionalen Parameter `attachmentUrl`

### 6. ChatWidget (Mitarbeiter) anpassen

- Upload-Logik: Datei in `chat-attachments/{contract_id}/{uuid}_{filename}` hochladen
- `handleSend` erweitern um Datei-Upload vor dem Senden der Nachricht
- "+" Button im Eingabebereich integrieren (eigenes inline Input, kein ChatInput-Komponente da ChatWidget eigenes Eingabefeld hat)

### 7. AdminLivechat anpassen

- `handleSend` erweitern um Datei-Upload
- ChatInput-Komponente uebergibt Datei via erweitertem Callback

---

## Technische Details

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| Migration (SQL) | `attachment_url` Spalte + `chat-attachments` Bucket + Storage-Policies |
| `src/components/chat/useChatRealtime.ts` | `attachment_url` in Interface + `sendMessage` erweitern |
| `src/components/chat/ChatInput.tsx` | "+" Button, File-Input, Datei-Vorschau, erweiterte `onSend` Signatur |
| `src/components/chat/ChatBubble.tsx` | Anhang-Anzeige (Bild-Vorschau oder Download-Link) |
| `src/components/chat/ChatWidget.tsx` | Upload-Logik + erweiterter Send-Handler |
| `src/pages/admin/AdminLivechat.tsx` | Upload-Logik + erweiterter Send-Handler |

### Upload-Pfad im Storage

```text
chat-attachments/{contract_id}/{uuid}_{original_filename}
```

### Eingabefeld-Layout

```text
+-----------------------------------------------+
| [+]  [Nachricht schreiben...        ]  [Send] |
+-----------------------------------------------+

Bei ausgewaehlter Datei:
+-----------------------------------------------+
| [bild.pdf  X]                                  |
| [+]  [Nachricht schreiben...        ]  [Send] |
+-----------------------------------------------+
```

### Anhang-Darstellung in ChatBubble

- Bilder: `<img>` mit max-width, klickbar (oeffnet in neuem Tab)
- Andere Dateien: Icon + Dateiname als Link
- Anhang wird oberhalb des Text-Contents angezeigt
