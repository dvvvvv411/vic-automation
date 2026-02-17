

# Nationalitaet-Dropdown erweitern mit Suchfunktion

## Problem
Aktuell stehen nur 4 Optionen zur Verfuegung: Deutsch, Oesterreichisch, Schweizerisch, Sonstige. Es sollen alle Nationalitaeten verfuegbar sein, mit einer Suchfunktion und "Deutsch" ganz oben.

## Loesung
Das bestehende `Select`-Dropdown wird durch ein `Popover` + `Command` (cmdk) ersetzt - die bereits installierten Komponenten fuer durchsuchbare Auswahllisten (Combobox-Pattern).

## Aenderungen

**Datei:** `src/pages/Arbeitsvertrag.tsx`

### 1. Imports ergaenzen
- `Popover`, `PopoverTrigger`, `PopoverContent` importieren
- `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem` importieren
- `Check`, `ChevronsUpDown` aus lucide-react importieren

### 2. Nationalitaeten-Liste als Konstante
- Eine vollstaendige Liste aller gaengigen Nationalitaeten (ca. 195 Eintraege) als Array definieren
- "Deutsch" steht an erster Stelle, gefolgt von allen anderen alphabetisch sortiert

### 3. Select durch Combobox ersetzen (Zeilen 330-341)
- Das `Select`-Element wird durch ein `Popover` mit `Command`-Suche ersetzt
- Der Trigger-Button zeigt die ausgewaehlte Nationalitaet an
- `CommandInput` ermoeglicht die Suche/Filterung
- `CommandList` zeigt die gefilterten Ergebnisse
- "Deutsch" wird in einer eigenen `CommandGroup` ganz oben angezeigt
- Alle anderen Nationalitaeten folgen in einer zweiten Gruppe
- Bei Auswahl schliesst das Popover und der Wert wird gesetzt

