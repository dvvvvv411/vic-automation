

# Mass-Import fuer Indeed-Bewerbungen

## Uebersicht

Im "Neue Bewerbung hinzufuegen"-Dialog wird ein zweiter Toggle "Mass Import" angezeigt, sobald "Indeed Bewerbung" aktiv ist. Wenn aktiviert, verschwinden alle Einzelfelder und werden durch ein grosses Textfeld ersetzt. Nur das Branding-Dropdown bleibt.

## Aenderungen in `src/pages/admin/AdminBewerbungen.tsx`

### Neue States

- `isMassImport` (boolean) -- nur sichtbar wenn `isIndeed` aktiv
- `massImportText` (string) -- Inhalt des Textfeldes
- `massImportErrors` (string[]) -- Fehlermeldungen pro Zeile

### UI-Aenderungen im Dialog

1. Unterhalb des Indeed-Toggles: neuer "Mass Import" Switch (nur wenn `isIndeed === true`)
2. Wenn `isMassImport` aktiv:
   - Alle Einzelfelder (Vorname, Nachname, E-Mail, Telefon) werden ausgeblendet
   - Grosses Textarea mit Placeholder-Beispiel erscheint
   - Branding-Dropdown bleibt sichtbar
   - Button-Text aendert sich zu "X Bewerbungen importieren"
3. Wenn `isMassImport` deaktiviert oder `isIndeed` deaktiviert: zurueck zum Einzelformular

### Parsing-Logik

Fuer jede nicht-leere Zeile:

```text
Eingabe: "Svenja Böttner TFAVct@t-online.de +4917670561418"

1. E-Mail per Regex finden (das Wort mit @)
2. Alles VOR der E-Mail = Name-Teil
3. Alles NACH der E-Mail = Telefon
4. Name-Teil: letztes Wort = Nachname, alles davor = Vorname(n)

Ergebnis: Vorname="Svenja", Nachname="Böttner", Email="TFAVct@t-online.de", Telefon="+4917670561418"
```

Beispiel mit mehreren Vornamen:

```text
Eingabe: "Anna Maria Schmidt anna@test.de +491234567"
Ergebnis: Vorname="Anna Maria", Nachname="Schmidt", ...
```

Wichtig: Namen werden 1:1 uebernommen, Umlaute (oe, ae, ue, ss) werden NICHT veraendert. Der Text wird exakt so gespeichert wie eingegeben.

### Submit-Logik

1. Alle Zeilen parsen und validieren
2. Bei Fehlern: Fehlermeldungen anzeigen, kein Import
3. Bei Erfolg: Alle Bewerber einzeln als `applications`-Rows einfuegen mit `is_indeed: true` und gewaehltem Branding
4. Nach erfolgreichem Import: Dialog schliessen, Toast mit Anzahl importierter Bewerbungen

### Fehlerbehandlung

- Zeilen ohne erkennbare E-Mail werden als Fehler markiert
- Zeilen ohne Telefonnummer werden als Fehler markiert (Indeed-Pflichtfeld)
- Zeilen ohne Namen werden als Fehler markiert
- Fehlerhafte Zeilen werden mit Zeilennummer angezeigt

## Keine Datenbank-Aenderungen

Es werden keine neuen Tabellen oder Spalten benoetigt. Die bestehende `applications`-Tabelle wird wie beim Einzelimport verwendet.

