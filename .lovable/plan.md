
# Eingabefeld automatisch vergroessern + Bearbeitungsfeld fuer vollen Text

## Was wird geaendert

### 1. ChatInput: Textarea waechst automatisch mit dem Text

**Datei: `src/components/chat/ChatInput.tsx`**

- Ein `useEffect` (oder Handler in `handleChange`) wird hinzugefuegt, der bei jeder Eingabe die Hoehe der Textarea automatisch anpasst: `textarea.style.height = "auto"` gefolgt von `textarea.style.height = textarea.scrollHeight + "px"`
- `max-h-[100px]` wird auf `max-h-[200px]` erhoeht (oder ganz entfernt), damit lange Nachrichten vollstaendig sichtbar sind
- Die Textarea bleibt weiterhin per Enter abschickbar (Shift+Enter fuer Zeilenumbruch)

### 2. ChatBubble: Bearbeitungs-Textarea zeigt den vollen Text

**Datei: `src/components/chat/ChatBubble.tsx`**

- Die Edit-Textarea (Zeile 131-139) bekommt dieselbe Auto-Resize-Logik: ein `ref` mit einem Effekt, der beim Oeffnen und bei jeder Aenderung die Hoehe an den Inhalt anpasst
- `min-h-[40px]` bleibt, aber kein festes `max-h` -- der gesamte Nachrichtentext ist sofort sichtbar wenn man auf Bearbeiten klickt
- `autoFocus` bleibt bestehen, Cursor wird ans Ende gesetzt

Keine neuen Dateien oder Abhaengigkeiten. Zwei kleine Aenderungen in bestehenden Dateien.
