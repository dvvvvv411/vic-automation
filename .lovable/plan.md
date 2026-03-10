

# Livechat Header aufräumen & Template-Erstellung in Dropdown integrieren

## Änderungen

### 1. Header bereinigen (`src/pages/admin/AdminLivechat.tsx`)
- **SMS senden Button** (Zeile 408-416, Smartphone-Icon) entfernen
- **SMS Dialog** (Zeile 580-620+) entfernen samt zugehörigem State (`smsDialogOpen`, `smsCode`, `smsSending`)
- **TemplateManager** (Zeile 445, Settings-Icon) aus dem Header entfernen
- **AiSuggestionBar** (Zeile 552-559) entfernen samt `aiSuggestionValue` State
- **ChatInput**: `externalValue` und `onExternalValueConsumed` Props entfernen (waren nur für AI-Vorschläge)
- Import-Bereinigung: `AiSuggestionBar`, `TemplateManager`, `Smartphone` entfernen

### 2. "Neues Template erstellen" in TemplateDropdown (`src/components/chat/TemplateDropdown.tsx`)
- Am Ende der gefilterten Template-Liste einen "+ Neues Template erstellen"-Button hinzufügen
- Neue Prop `onCreateNew` hinzufügen, die einen Dialog/Callback auslöst
- Der Button wird immer angezeigt, auch wenn Templates vorhanden sind (solange Dropdown sichtbar)

### 3. Template-Erstellungs-Dialog in ChatInput integrieren (`src/components/chat/ChatInput.tsx`)
- `TemplateManager`-Dialog (nur den Erstellungs-Teil) als inline Dialog einbetten
- Neuer State `templateDialogOpen` in ChatInput
- Wenn "Neues Template erstellen" im Dropdown geklickt wird, öffnet sich der Dialog
- Nach Erstellung wird die Query invalidiert und das neue Template erscheint im Dropdown

### 4. Dropdown auch bei leerem `!` anzeigen (`src/components/chat/TemplateDropdown.tsx`)
- Aktuell: Dropdown zeigt nichts wenn keine Templates matchen
- Neu: Auch bei leerem Ergebnis den "+ Neues Template"-Button anzeigen

