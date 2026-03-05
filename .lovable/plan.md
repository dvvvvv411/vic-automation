

# SMS Watch Redesign

## Probleme & Anforderungen

1. ScrollArea funktioniert nicht (braucht feste Hoehe statt `max-h-72`)
2. Neueste SMS soll direkt im Header-Button als Preview sichtbar sein (ohne Dropdown)
3. Alle 5 Sekunden Aktualisierung (ist bereits implementiert via `refetchInterval: 5000`)
4. Direkt eine neue Telefonnummer hinzufuegen koennen (API-Link Input im Dropdown)
5. Insgesamt schoener und moderner gestalten

## Aenderungen

### `src/components/chat/SmsWatch.tsx` -- Komplett ueberarbeiten

**Header-Button:**
- Zeigt die neueste SMS als einzeiligen Preview-Text neben dem Eye-Icon (truncated)
- Badge fuer neue SMS bleibt
- Wenn keine Nummer gewaehlt: "SMS Watch" Text

**Popover-Inhalt (Nummer gewaehlt):**
- ScrollArea mit fester Hoehe (`h-72`) statt `max-h-72` fuer korrektes Scrolling
- SMS-Karten mit leichtem Farbakzent fuer die neueste SMS
- Header mit Telefonnummer + "Aendern" Button

**Popover-Inhalt (keine Nummer):**
- Liste der verfuegbaren Nummern
- Neuer Abschnitt unten: Input-Feld fuer neuen anosim API-Link + Hinzufuegen-Button
- Nutzt `useMutation` zum Einfuegen in `phone_numbers` Tabelle (gleiche Logik wie AdminTelefonnummern)

**Visuelles Upgrade:**
- Neueste SMS im Popover mit gruener/blauen Akzent-Border hervorgehoben
- Kompaktere SMS-Karten
- Pulsierender Punkt neben dem Icon wenn aktiv ueberwacht wird

