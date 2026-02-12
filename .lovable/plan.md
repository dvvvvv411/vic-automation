

# Geburtsdatum: Manuelle Eingabe statt Kalender

## Aenderung

Die Kalender-Auswahl fuer das Geburtsdatum wird durch ein normales Textfeld mit dem Platzhalter `TT.MM.JJJJ` ersetzt. Der Nutzer tippt das Datum manuell ein (z.B. `01.01.2000`).

### `src/pages/Arbeitsvertrag.tsx`

1. **Form-State aendern**: `birth_date` wird von `Date | null` zu `string` (Initialwert `""`)
2. **Zeile 304**: Die `DatePickerField`-Komponente wird ersetzt durch ein `Input`-Feld:
   - `placeholder="TT.MM.JJJJ"`
   - Gruene Border wenn gueltig
   - Maxlength 10
3. **Validierung**: Im `isStepValid()` wird geprueft, ob der String dem Format `DD.MM.YYYY` entspricht und ein gueltiges Datum ergibt (Regex + Date-Parse)
4. **Submit-Konvertierung**: Beim Absenden wird der String `"01.01.2000"` in das DB-Format `"2000-01-01"` umgewandelt (statt `format(form.birth_date!, "yyyy-MM-dd")`)
5. **Zusammenfassung**: Zeigt direkt den eingegebenen String an (ist bereits im Format `dd.MM.yyyy`)

### Keine anderen Dateien betroffen

Der `DatePickerField` fuer "Gewuenschtes Startdatum" bleibt als Kalender bestehen -- nur Geburtsdatum wird zum Textfeld.

