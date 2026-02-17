
# Resend E-Mail-Konfiguration pro Branding

## Uebersicht
Jedes Branding bekommt drei zusaetzliche Felder fuer eine individuelle Resend-E-Mail-Konfiguration: Absendermail, Absendername und Resend API Key. Damit kann pro Branding ein eigener E-Mail-Versand konfiguriert werden.

## Aenderungen

### 1. Datenbank-Migration
Drei neue Spalten in der Tabelle `brandings`:

| Spalte | Typ | Nullable | Beschreibung |
|--------|-----|----------|--------------|
| `resend_from_email` | text | Ja | Absender-E-Mail fuer Resend |
| `resend_from_name` | text | Ja | Absendername fuer Resend |
| `resend_api_key` | text | Ja | Resend API Key (individuell pro Branding) |

### 2. Frontend - AdminBrandings.tsx

**Schema erweitern** (`brandingSchema`):
- `resend_from_email` - optionale E-Mail-Validierung (wie das bestehende `email`-Feld)
- `resend_from_name` - optionaler String, max 200 Zeichen
- `resend_api_key` - optionaler String, max 200 Zeichen

**Formular erweitern** (`initialForm`):
- Drei neue Felder mit Leerstring als Default

**Dialog-Formular**:
- Neue Sektion "Resend E-Mail-Konfiguration" mit Trennlinie und Ueberschrift
- Eingabefeld "Absender-E-Mail" (`resend_from_email`) mit Placeholder z.B. `noreply@example.com`
- Eingabefeld "Absendername" (`resend_from_name`) mit Placeholder z.B. `Muster GmbH`
- Eingabefeld "Resend API Key" (`resend_api_key`) mit `type="password"` damit der Key nicht im Klartext sichtbar ist, Placeholder z.B. `re_...`

**Edit-Modus** (`openEdit`):
- Die drei neuen Felder aus dem Branding-Objekt in das Formular uebernehmen

### 3. Sicherheitshinweis
Der Resend API Key wird direkt in der Datenbank gespeichert. Da die `brandings`-Tabelle durch RLS auf Admins beschraenkt ist (nur Admins koennen lesen/schreiben), ist das fuer diesen Anwendungsfall akzeptabel. Edge Functions koennen spaeter den Key aus der Tabelle lesen, um E-Mails ueber das jeweilige Branding zu versenden.
