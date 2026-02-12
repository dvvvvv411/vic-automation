
# Optimierungen der /arbeitsvertrag Seite

## 1. Gruene Outline fuer ausgefuellte Felder

Alle Input-, Select- und Datepicker-Felder erhalten eine gruene Border (`border-green-500`), sobald sie einen Wert enthalten. Dies gibt dem Nutzer visuelles Feedback ueber den Fortschritt.

- Input-Felder: `className` dynamisch mit `border-green-500` wenn `value.trim() !== ""`
- Select-Felder: Gruene Border wenn ein Wert gewaehlt ist
- Datepicker-Buttons: Gruene Border wenn ein Datum gewaehlt ist

## 2. Geburtsdatum-Kalender mit Jahr/Monat-Dropdown

Der Geburtsdatum-Kalender bekommt `captionLayout="dropdown-buttons"` sowie `fromYear={1940}` und `toYear={new Date().getFullYear()}`, sodass man Jahr und Monat direkt per Dropdown waehlen kann statt monatsweise zurueck zu navigieren.

Das gewuenschte Startdatum bleibt unveraendert (normaler Kalender).

Dazu wird der `DatePickerField` um einen optionalen Parameter `useDropdownNavigation` erweitert.

## 3. Stepper-Linien Fix

Aktuell sind die Linien zwischen den Steps innerhalb des `flex items-center` Container des jeweiligen Steps, was zu Alignment-Problemen fuehrt. Die Loesung:

- Den Stepper umstrukturieren: Zuerst alle Kreise und Linien in einem sauberen Flex-Layout mit `flex-1` fuer die Linien zwischen den Kreisen, sodass sie sich gleichmaessig verteilen und korrekt ausgerichtet sind.

## 4. Bankverbindung - Hinweistext

Im Schritt "Bankverbindung" (step === 2) wird der Untertitel/Beschreibungstext ergaenzt zu: "Bitte geben Sie Ihre Bankverbindung fuer die Gehaltsauszahlung an."

## 5. Ausweisdokumente - Nebeneinander + Text in Cards + Thumbnail

Die beiden Upload-Felder werden nebeneinander dargestellt (`grid grid-cols-2 gap-4`). Der Upload-Bereich wird zu einer Card umgestaltet:

- **Vor Upload**: Card mit dem Label-Text ("Ausweis Vorderseite" / "Ausweis Rueckseite") direkt darin + Upload-Icon. Kein separates Label mehr.
- **Nach Upload**: Die Card zeigt das Thumbnail-Bild als Hintergrund/Inhalt mit einem kleinen X-Button zum Entfernen. Der Text verschwindet und wird durch das Bild ersetzt.

## Technische Aenderungen

Nur eine Datei wird geaendert: `src/pages/Arbeitsvertrag.tsx`

| Bereich | Zeilen (ca.) | Aenderung |
|---|---|---|
| Input-Felder | 282-335 | `className` mit bedingter gruener Border |
| Select-Felder | 311-333 | `className` mit bedingter gruener Border auf SelectTrigger |
| DatePickerField | 212-241 | `useDropdownNavigation` Prop + `captionLayout="dropdown-buttons"` + gruene Border |
| Stepper | 250-269 | Neues Layout mit `flex-1` Linien zwischen Kreisen |
| Bank-Schritt | 357-371 | Hinweistext "fuer die Gehaltsauszahlung" hinzufuegen |
| Dokumente-Schritt | 375-407 | Grid 2-spaltig, Label in Card, Thumbnail-Ersetzung |
