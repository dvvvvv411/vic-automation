
# Dropdown-Problem auf Mobilgeraeten beheben (Familienstand & Art der Beschaeftigung)

## Problem

Die Select-Dropdowns fuer "Familienstand" und "Art der Beschaeftigung" auf der `/arbeitsvertrag/:id`-Seite zeigen auf Mobilgeraeten nur einen weissen Bildschirm an. 

**Ursache:** In der `SelectContent`-Komponente (`src/components/ui/select.tsx`) wird die Viewport-Hoehe auf `h-[var(--radix-select-trigger-height)]` gesetzt. Das beschraenkt die Hoehe des Dropdown-Inhalts auf die Hoehe des Trigger-Buttons (ca. 40px), wodurch die Eintraege nicht sichtbar sind -- man sieht nur weissen Hintergrund.

## Loesung

**Datei: `src/components/ui/select.tsx`, Zeile 82**

Die CSS-Klasse `h-[var(--radix-select-trigger-height)]` wird zu `max-h-[var(--radix-select-content-available-height)]` geaendert. So wird der Viewport nicht auf die Trigger-Hoehe beschraenkt, sondern nutzt den verfuegbaren Platz.

```text
Vorher:  h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]
Nachher: w-full min-w-[var(--radix-select-trigger-width)]
```

Das entfernt die fehlerhafte Hoehenbeschraenkung und laesst das Dropdown seinen Inhalt normal anzeigen. Keine neuen Dateien oder Abhaengigkeiten noetig.
