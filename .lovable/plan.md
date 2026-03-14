

# Mitarbeiter-Detail: UI-Feinschliff

## Änderungen

### 1. Persönliche Daten Card — Titel + Feld-Aufteilung
- "Adresse" aus dem Card-Header entfernen → nur "Persönliche Daten" als Titel
- Linke Spalte: Vorname, Nachname, Email, Telefon, Geburtsdatum, Geburtsort, Nationalität (7 Felder)
- Rechte Spalte: Familienstand, Beschäftigungsart, Startdatum, Straße, PLZ, Stadt (6 Felder)

### 2. Abstand in Zugangsdaten + Admin-Notizen
`CardContent` bekommt `pt-4` statt `pt-0` bei CredentialsCard und AdminNotesCard, damit zwischen Gradient-Header und Content Luft ist.

### Betroffene Datei
`AdminMitarbeiterDetail.tsx` — Zeilen 147-183 (EditableDualSection Header-Anpassung für Single-Title-Modus), Zeilen 203/264 (pt-4), Zeilen 747-771 (Feld-Zuordnung)

