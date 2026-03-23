

## Plan: 2 Aenderungen

### 1. Erinnerungs-Email mit Umbuchungs-Button (`AdminBewerbungsgespraeche.tsx`)

In der `handleConfirmReminder` Funktion (Zeile 206-215) wird die Email erweitert:

- Vor dem `sendEmail` Aufruf: `buildBrandingUrl(brandingId, /bewerbungsgespraech/${item.application_id})` aufrufen um den Buchungslink zu generieren
- `body_lines` erweitern: nach der bestehenden SMS-Nachricht einen zusaetzlichen Satz wie "Falls Sie den Termin nicht wahrnehmen können, haben Sie die Möglichkeit, einen neuen Termin zu buchen."
- `button_text: "Termin umbuchen"` und `button_url` mit dem generierten Link hinzufuegen

Da die Buchungsseite bereits das Umbuchen unterstuetzt (aus dem vorherigen Feature), landet der Bewerber direkt auf seiner Buchungsseite mit dem gebuchten Termin und Umbuchen-Option.

### 2. Erneut-Senden Button in `/admin/bewerbungen` (`AdminBewerbungen.tsx`)

In der `renderActions` Funktion (Zeile 578-634):

- Neuen `resendMutation` erstellen, der exakt die gleiche Logik wie `acceptMutation` ausfuehrt (Email/SMS senden), aber OHNE den Status zu aendern (kein DB-Update)
- Der Mutation-Code kopiert die Versand-Logik aus `acceptMutation` (Zeilen 215-354): Indeed → Email + SMS-Spoof, External → Email + SMS mit Jobtitel, Normal → Email + SMS mit Shortlink
- Neues Icon (z.B. `RotateCcw` oder `RefreshCw` aus lucide-react) als Button bei Status `bewerbungsgespraech` oder `termin_gebucht` anzeigen
- Tooltip: "Akzeptierungs-Benachrichtigung erneut senden"

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `AdminBewerbungsgespraeche.tsx` | Umbuchungs-Button in Erinnerungs-Email |
| `AdminBewerbungen.tsx` | Resend-Icon + Mutation |

