
# SMS-Benachrichtigung per Glocken-Button im Livechat

## Uebersicht

Im Admin-Livechat-Header wird ein neuer Button mit Glocken-Icon hinzugefuegt. Beim Klick oeffnet sich ein Dialog mit einer vorausgefuellten SMS-Nachricht, die der Admin vor dem Versand bearbeiten kann. Erst nach Bestaetigung im Dialog wird die SMS verschickt.

## Aenderungen (nur `src/pages/admin/AdminLivechat.tsx`)

### 1. Neuer Import

- `Bell` Icon aus `lucide-react` importieren

### 2. Neue State-Variablen

- `notifySmsDialogOpen` (boolean) – steuert ob der Dialog offen ist
- `notifySmsText` (string) – der bearbeitbare SMS-Text
- `notifySmsSending` (boolean) – Ladezustand waehrend des Versands

### 3. Glocken-Button im Header

Neben dem bestehenden "+ Auftrag"-Button wird ein neuer Icon-Button eingefuegt:

```
[Code] [Check] [Smartphone] [+ Auftrag] [Glocke] [Templates] [Avatar]
```

Der Button ist nur sichtbar, wenn ein Chat aktiv ist UND eine Telefonnummer vorliegt.

### 4. Dialog mit bearbeitbarer Nachricht

- Oeffnet sich beim Klick auf die Glocke
- Textarea mit vorausgefuelltem Text: `"Sie haben eine neue Nachricht im Livechat. Bitte lesen Sie diese."`
- Der Admin kann den Text frei bearbeiten
- "Senden"-Button verschickt die SMS ueber die bestehende `sendSms`-Funktion
- Der Absendername wird wie bei den anderen SMS-Funktionen aus dem Branding ermittelt

### 5. Versandlogik

Nutzt die bestehende `sendSms`-Funktion mit:
- `to`: Telefonnummer des Mitarbeiters
- `text`: Der (ggf. bearbeitete) Text aus dem Dialog
- `event_type`: `"livechat_benachrichtigung"`
- `recipient_name`: Name des Mitarbeiters
- `from`: Branding-Absendername (wie bei Ident-Code SMS)

## Keine weiteren Aenderungen

Keine Datenbank-Aenderungen. Nur UI-Erweiterung in einer Datei.
