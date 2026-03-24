

## Plan: Erinnerungs-SMS Text anpassen

### Aenderung

**`AdminBewerbungsgespraeche.tsx`** Zeile 181-183:

Den Fallback-Text und die Template-Platzhalter-Logik aendern:

**Vorher:**
```
"Hallo {name}, Sie hatten einen Termin bei uns, waren aber leider nicht erreichbar. Bitte rufen Sie uns an: {telefon}."
```

**Nachher:**
```
"Hallo {name}, Sie hatten einen Termin für ein Bewerbungsgespräch bei uns, waren aber leider telefonisch nicht erreichbar. Bitte buchen Sie einen neuen Termin über den Link, den Sie per E-Mail erhalten haben."
```

Der `{telefon}`-Platzhalter wird nicht mehr benoetigt, da der neue Text keinen Telefonverweis enthaelt.

Zusaetzlich sollte das SMS-Template `gespraech_erinnerung` in der Datenbank aktualisiert werden (falls vorhanden), damit auch bei Nutzung des Templates der neue Text kommt. Das kann ueber `/admin/sms-vorlagen` manuell gemacht werden, oder ich aktualisiere den Fallback-Text im Code.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `AdminBewerbungsgespraeche.tsx` | Fallback-SMS-Text aktualisieren |

