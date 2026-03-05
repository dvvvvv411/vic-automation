

# SMS Watch im Admin-Livechat Header

## Uebersicht

Ein neues "SMS Watch" Element wird im Chat-Header zwischen dem Mitarbeiternamen und dem Code-Eingabefeld eingefuegt. Es ermoeglicht dem Admin, eine der unter `/admin/telefonnummern` hinzugefuegten Telefonnummern auszuwaehlen und eingehende SMS in Echtzeit (alle 5 Sekunden) zu ueberwachen.

## Funktionsweise

1. **SMS Watch Button** im Header -- klickt der Admin darauf, oeffnet sich ein Popover
2. **Telefonnummern-Auswahl**: Popover zeigt alle `phone_numbers`-Eintraege (via anosim-proxy). Admin waehlt eine Nummer aus
3. **Aktive Ueberwachung**: Nach Auswahl wird die ausgewaehlte Nummer alle 5s abgefragt. Badge zeigt Anzahl neuer SMS seit Auswahl
4. **SMS-Ansicht**: Erneuter Klick zeigt die letzten 10 empfangenen SMS + Button zum Wechseln der Nummer

## Aenderungen

### 1. Neue Komponente: `src/components/chat/SmsWatch.tsx`

- Eigene Komponente fuer das gesamte SMS Watch Feature
- State: `selectedPhoneId`, `smsList`, `lastSeenCount`
- Laedt `phone_numbers` aus der DB
- Fuer die ausgewaehlte Nummer: `useQuery` mit `refetchInterval: 5000` ueber `anosim-proxy`
- Popover mit zwei Ansichten:
  - **Keine Nummer ausgewaehlt**: Liste der verfuegbaren Nummern zum Auswaehlen
  - **Nummer ausgewaehlt**: Letzte 10 SMS + Button "Nummer aendern"
- Badge am Button zeigt neue SMS seit letztem Oeffnen

### 2. `src/pages/admin/AdminLivechat.tsx`

- Import und Platzierung von `<SmsWatch />` im Header zwischen Name und Code-Eingabefeld (Zeile ~384, vor dem `quickSmsCode` Input)

## Zusammenfassung

| Datei | Aenderung |
|---|---|
| `src/components/chat/SmsWatch.tsx` | Neue Komponente |
| `AdminLivechat.tsx` | SmsWatch im Header einfuegen |

