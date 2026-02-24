
# Links im Chat anklickbar machen

## Was wird geaendert

**Datei: `src/components/chat/ChatBubble.tsx`**

Aktuell wird der Nachrichtentext einfach als Plain Text in einem `<p>`-Tag gerendert (Zeile 117). URLs werden nicht erkannt und sind nicht anklickbar.

## Loesung

Eine Hilfsfunktion `renderMessageContent` wird erstellt, die den Text nach URLs durchsucht (per Regex) und diese als `<a>`-Tags mit `target="_blank"` und `rel="noopener noreferrer"` rendert. Der Rest des Texts bleibt normaler Text.

### Technische Details

1. **Neue Funktion `linkifyContent`** in `ChatBubble.tsx`:
   - Regex erkennt URLs (http/https und www.)
   - Gibt ein Array aus Text-Strings und React `<a>`-Elementen zurueck
   - Links bekommen `target="_blank"`, `rel="noopener noreferrer"` und ein dezentes Underline-Styling

2. **Zeile 117 aendern**: Statt `{content}` wird `{linkifyContent(content)}` verwendet, damit URLs automatisch als anklickbare Links dargestellt werden

3. **Styling**: Links erhalten `underline` und bei eigenen Nachrichten (primary background) eine passende helle Farbe, bei fremden Nachrichten die Standard-Link-Farbe

Keine neuen Abhaengigkeiten noetig -- reine String-Verarbeitung mit React-Elementen.
