

# KI-Antwortvorschlaege im Admin-Livechat

## Uebersicht

Eine KI-Funktion analysiert den gesamten Chatverlauf (alle Konversationen) und generiert automatisch Antwortvorschlaege auf die letzte Nachricht des Mitarbeiters. Der Vorschlag wird in einem blauen, KI-gebrandeten Feld oberhalb des regulaeren Eingabefeldes angezeigt.

## Architektur

```text
+---------------------------+
|  AdminLivechat            |
|                           |
|  Nachrichten-Bereich      |
|  ...                      |
|                           |
|  +---------------------+  |
|  | AiSuggestionBar     |  |  <-- NEU: Blaues KI-Feld
|  | "Vorgeschlagen: ..."  |
|  | [Uebernehmen]        |  |
|  +---------------------+  |
|  +---------------------+  |
|  | ChatInput (regulaer)|  |  <-- Bestehendes Eingabefeld
|  +---------------------+  |
+---------------------------+
         |
         | Aufruf bei jeder neuen User-Nachricht
         v
+---------------------------+
| Edge Function             |
| ai-chat-suggest           |
|  - Laedt ALLE Chats       |
|  - Sendet an Lovable AI   |
|  - Gibt Vorschlag zurueck |
+---------------------------+
```

## Aenderungen

### 1. Neue Edge Function: `supabase/functions/ai-chat-suggest/index.ts`

- Empfaengt `contract_id` des aktiven Chats
- Laedt die letzten 20 Nachrichten des aktiven Chats als Kontext
- Laedt die letzten 100 Nachrichten aus ALLEN anderen Chats als "Erfahrungsbasis" (wie antwortet der Admin normalerweise?)
- Sendet alles an Lovable AI Gateway (`google/gemini-3-flash-preview`) mit einem System-Prompt, der den Kontext erklaert
- Gibt einen einzelnen Antwortvorschlag als Text zurueck (kein Streaming noetig)
- Nutzt `LOVABLE_API_KEY` (bereits vorhanden) und `SUPABASE_SERVICE_ROLE_KEY` fuer DB-Zugriff

### 2. Neue Komponente: `src/components/chat/AiSuggestionBar.tsx`

- Wird angezeigt, wenn die letzte Nachricht im Chat vom Mitarbeiter (`sender_role === "user"`) stammt
- Ruft automatisch die Edge Function auf, wenn sich die letzte User-Nachricht aendert
- Zeigt waehrend des Ladens einen Shimmer/Skeleton-Effekt
- Zeigt den Vorschlag in einem blauen Container mit KI-Icon (Sparkles) und "KI-Vorschlag"-Label
- Button "Uebernehmen" fuellt den Text ins regulaere Eingabefeld
- Button zum Schliessen/Verwerfen des Vorschlags
- Visuelles Design: Blauer Hintergrund (`bg-blue-50 border-blue-200`), KI-Icon, dezent aber sichtbar

### 3. Integration in `src/pages/admin/AdminLivechat.tsx`

- `AiSuggestionBar` wird zwischen Draft-Preview und `ChatInput` eingefuegt
- Ein Callback `onAcceptSuggestion` setzt den Text ins ChatInput (ueber neuen prop `initialValue` oder ref-basiert)
- Die Komponente bekommt `contractId` und `messages` als Props

### 4. ChatInput erweitern

- Neuer optionaler Prop `externalValue` oder `onExternalInsert`: Wenn der Admin einen KI-Vorschlag uebernimmt, wird der Text ins Eingabefeld gesetzt
- Minimale Aenderung: ein `useEffect` der auf einen externen Wert reagiert

### 5. Config: `supabase/config.toml`

- Neuer Eintrag fuer `ai-chat-suggest` mit `verify_jwt = false`

## KI-Prompt-Strategie

Der System-Prompt wird:
- Den Admin als professionellen Ansprechpartner positionieren
- Die Sprache auf Deutsch setzen
- Beispiele aus anderen Chats als Referenz nutzen ("So antwortest du normalerweise")
- Einen einzelnen, natuerlich klingenden Antwortvorschlag generieren
- Kurz und praegnant bleiben (max 2-3 Saetze)

## Ablauf

1. Mitarbeiter sendet Nachricht
2. Realtime-Update kommt an, `messages` wird aktualisiert
3. `AiSuggestionBar` erkennt neue letzte User-Nachricht, triggert Edge Function
4. Edge Function laedt Kontext, ruft Lovable AI auf, gibt Vorschlag zurueck
5. Vorschlag erscheint im blauen Feld
6. Admin klickt "Uebernehmen" -- Text wird ins Eingabefeld uebertragen
7. Admin kann den Text anpassen und absenden

