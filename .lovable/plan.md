

## Plan: KI-Polish mit Vorschau-Bar ueber dem Chat

### Umsetzung

**1. Neue Edge Function `ai-chat-polish/index.ts`**
- Empfaengt `{ text: string }`
- System-Prompt: "Korrigiere Rechtschreibung/Grammatik, formuliere professioneller. Antworte NUR mit dem verbesserten Text."
- Gibt `{ polished: string }` zurueck
- Fehlerbehandlung 429/402

**2. `supabase/config.toml`**
- `[functions.ai-chat-polish]` mit `verify_jwt = false`

**3. `ChatInput.tsx` — KI-Button + Vorschau-Leiste**

- Neuer State: `polishing` (boolean), `polishedText` (string | null)
- Kleiner "KI"-Button (Sparkles-Icon) neben dem Textarea, nur sichtbar wenn `showTemplates` (= Admin) und `input.trim()` nicht leer
- Klick ruft `supabase.functions.invoke("ai-chat-polish", { body: { text: input } })` auf
- Waehrend Loading: Button zeigt Loader/disabled

**Vorschau-Leiste** (aehnlich wie `AiSuggestionBar`):
- Erscheint oberhalb der Eingabezeile wenn `polishedText` gesetzt ist
- Zeigt den verbesserten Text in einer blauen Box mit Sparkles-Icon + Label "KI-Vorschlag"
- Drei Aktionen:
  - **Uebernehmen** (Check-Icon): setzt `input` auf `polishedText`, schliesst Vorschau
  - **Neu formulieren** (RefreshCw-Icon): ruft erneut `ai-chat-polish` mit aktuellem `input` auf
  - **Verwerfen** (X-Icon): schliesst Vorschau ohne Aenderung

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `supabase/functions/ai-chat-polish/index.ts` | Neue Edge Function |
| `supabase/config.toml` | Neuer Funktionseintrag |
| `src/components/chat/ChatInput.tsx` | KI-Button, polishedText State, Vorschau-Leiste mit Uebernehmen/Neu/Verwerfen |

