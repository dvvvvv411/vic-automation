

# Mitarbeiter-Detail: Tab-Layout + Zugangsdaten + Notizen

## Referenz-Analyse
Profil-Header mit Avatar + Name + Badges, darunter Tabs. Übersicht zeigt Persönliche Daten + Adresse, Zugangsdaten-Card, Admin-Notizen, Bankverbindung.

## Geplante Änderungen

### 1. Profil-Header
Avatar-Kreis mit Initialen, Name + Status-Badges, E-Mail + Branding. Action-Buttons rechts (Livechat, Auftrag zuweisen, Genehmigen, Sperren).

### 2. Tab-Navigation (4 Tabs)
- **Übersicht** — Persönliche Daten, Kontakt, Adresse, Bank, Steuer (inline-editierbar) + Zugangsdaten-Card + Admin-Notizen
- **Personalausweis** — ID-Bilder mit Vorschau
- **Aufträge** — Aufträge-Tabelle
- **Bewertungen** — Reviews mit Collapsible

### 3. Übersicht-Tab Layout
```text
┌──────────────────────────────────┐  ┌──────────────────────┐
│ PERSÖNLICHE DATEN  │  ADRESSE    │  │ Zugangsdaten         │
│ Vorname, Nachname  │  Straße     │  │ E-Mail [copy]        │
│ Geburtsdatum etc.  │  PLZ, Stadt │  │ Passwort [show][copy]│
│──────────────────────────────────│  ├──────────────────────┤
│ BANKVERBINDUNG     │  STEUER     │  │ Admin-Notizen        │
│ IBAN, BIC, Bank    │  StID, SV   │  │ [Textarea]  [Speich.]│
└──────────────────────────────────┘  └──────────────────────┘
```

### 4. Editierbare Daten
"Bearbeiten"-Button pro Card-Section → Felder werden Inputs → "Speichern" updated `employment_contracts`.

### 5. Admin-Notizen
Neues DB-Feld `admin_notes text` auf `employment_contracts`. Textarea mit Speichern-Button.

### 6. Zugangsdaten-Card
- E-Mail mit Copy-Button
- Temp. Passwort mit Show/Hide Toggle + Copy-Button

### Betroffene Dateien
| Datei | Änderung |
|-------|----------|
| `AdminMitarbeiterDetail.tsx` | Kompletter Umbau: Tab-Layout, editierbare Felder, Zugangsdaten-Card, Notizen-Card |
| Supabase Migration | `ALTER TABLE employment_contracts ADD COLUMN admin_notes text;` |

### Styling
Premium-Cards mit `rounded-2xl`, `shadow-md`, uppercase Section-Headers. Field labels in `text-xs uppercase tracking-wider text-muted-foreground`.

