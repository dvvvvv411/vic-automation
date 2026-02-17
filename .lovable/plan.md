
# Bewerbungsgespraech-Seite im Attendflow-Stil modernisieren

## Ueberblick

Die `/bewerbungsgespraech/:id` Seite wird visuell aufgewertet -- moderner, polierter Look im Attendflow-Stil (helles Theme, cleane SaaS-Aesthetik), passend zum Rest des Panels.

## Aenderungen an `src/pages/Bewerbungsgespraech.tsx`

### Allgemeines Layout
- Hintergrund von `bg-slate-50` zu einem subtilen Gradient (`bg-gradient-to-br from-slate-50 via-white to-blue-50/30`)
- Card von `rounded-xl shadow-sm` zu `rounded-2xl shadow-md` (wie im Mitarbeiter-Panel)
- Mehr Whitespace und grosszuegigere Padding-Werte

### Header-Bereich
- Titel groesser und mit `tracking-tight` (bereits vorhanden, bleibt)
- Bewerber-Info-Zeile: Badges/Pills statt einfacher Text-Spans -- jedes Info-Element (Name, Telefon, Anstellungsart) als dezente Pill mit hellem Hintergrund (`bg-slate-100 rounded-full px-3 py-1`)

### Kalender-Bereich
- Saubere Labels mit feinerem Styling
- Kalender bleibt funktional gleich

### Zeitslots
- Von `rounded-md` zu `rounded-lg` mit weicherem Hover-Effekt
- Leichte Schatten auf dem selektierten Slot (`shadow-sm`)
- Sanftere Transitions (`transition-all duration-200`)

### Buchungs-Button
- `rounded-xl` statt `rounded-md`
- Leichter Shadow (`shadow-md`) und Hover-Scale-Effekt via `hover:shadow-lg hover:scale-[1.01] transition-all`

### Bestaetigungsseite
- Gleiches Gradient-Background
- Card `rounded-2xl shadow-md`
- Checkmark-Icon groesser mit farbigem Hintergrund-Kreis
- Termin-Info-Box mit dezenterem Border und hellem Hintergrund

### Powered-by Footer
- Etwas mehr Abstand, dezenterer Text

### Fehlerseite
- Gleicher Gradient-Background und `rounded-2xl shadow-md`

## Technische Details

Nur eine Datei betroffen: `src/pages/Bewerbungsgespraech.tsx`

Hauptsaechlich CSS-Klassen-Aenderungen:

```text
Vorher                          Nachher
------                          -------
bg-slate-50                     bg-gradient-to-br from-slate-50 via-white to-blue-50/30
rounded-xl shadow-sm            rounded-2xl shadow-md
border border-slate-200         border border-slate-200/80
Bewerber-Info als Text-Spans    Bewerber-Info als Pills (bg-slate-100 rounded-full)
Time-Slot rounded-md            rounded-lg + transition-all duration-200
Book-Button (default)           rounded-xl shadow-md hover:shadow-lg
CheckCircle h-10 w-10           h-12 w-12 mit bg-[brandColor]/10 Kreis-Wrapper
```

Keine funktionalen Aenderungen, keine neuen Abhaengigkeiten, keine Datenbank-Aenderungen.
