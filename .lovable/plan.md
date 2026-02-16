

# Auth-Seite: Logo und Text zentrieren

## Aenderung

In der linken Spalte der Auth-Seite werden Logo und "Ihr Mitarbeiterportal" horizontal und vertikal zentriert dargestellt. Die Trust-Points werden ebenfalls zentriert darunter angezeigt.

## Technische Umsetzung

**Datei**: `src/pages/Auth.tsx`

- Dem aeusseren Container der linken Spalte `items-center text-center` hinzufuegen (aktuell nur `flex-col justify-center`)
- Der `motion.div` bekommt `items-center text-center` damit Logo, Text und Trust-Points zentriert sind
- Logo-Image: `mx-auto` hinzufuegen
- Trust-Points: `justify-center` statt nur `items-center` im Flex-Container, und Text zentrieren

Keine neuen Dateien oder Abhaengigkeiten noetig.

