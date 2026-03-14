

# E-Mail-Vorlagen modernisieren

## Problem
Die `buildEmailHtml`-Funktion erzeugt ein sehr schlichtes Layout: einfacher farbiger Header-Block, plainer weißer Body, Standard-Button. Passt nicht zum Premium-Admin-Design.

## Modernisierungen

### Visuelles Upgrade der HTML-Vorlage
- **Header**: Gradient-Effekt statt Flat-Color, größeres Padding, subtiler Schatten nach unten
- **Body**: Greeting-Bereich mit leichtem Hintergrund-Akzent (brandColor bei 5% Opacity), bessere Typografie mit größerer Zeilenhöhe
- **Buttons**: Abgerundeter (border-radius 8px), mit subtiler Box-Shadow, leichter Gradient-Effekt auf dem Button
- **Info-Blöcke** (z.B. E-Mail/Passwort, Auftragsdaten): Hervorgehobene "Card"-Blöcke mit hellem Hintergrund und linkem Brand-Color-Border (statt plain Text)
- **Footer**: Dezenterer Look mit kleinerem Text, subtiler oberer Trennlinie in brandColor
- **Allgemein**: Box-Shadow auf dem gesamten E-Mail-Container für "schwebenden" Look

### Betroffene Dateien (identische Änderung)
1. **`supabase/functions/send-email/index.ts`** — Die produktive `buildEmailHtml`-Funktion
2. **`src/pages/admin/AdminEmails.tsx`** — Die Vorschau-Kopie der `buildEmailHtml`-Funktion

Beide Funktionen werden identisch aktualisiert, damit Vorschau und tatsächlich versendete E-Mails übereinstimmen.

### Kein Breaking Change
Die Funktion behält dieselbe Signatur. Alle bestehenden Aufrufer (10 Event-Typen) funktionieren ohne Änderung.

