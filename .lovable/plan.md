

## Haupt-Jobtitel Feld im Branding

### Ziel
Neues optionales Textfeld `main_job_title` in der Branding-Verwaltung, um den Haupt-Stellenanzeigentitel zu speichern (z.B. "Mitarbeiter für Onlineprozess-Tests (Quality Assurance)").

### Änderungen

**1. DB-Migration**: Neue Spalte `main_job_title` (text, nullable) in `brandings`.

**2. AdminBrandingForm.tsx**: 
- Feld im Schema, initialForm und useEffect ergänzen
- Eingabefeld in der "Stammdaten"-Card unter dem Unternehmensnamen einfügen mit Label "Haupt-Jobtitel" und Platzhalter "z.B. Mitarbeiter für Onlineprozess-Tests (Quality Assurance)"

**3. Bestehende Brandings aktualisieren**: Per INSERT-Tool alle vorhandenen Brandings mit dem Wert "Mitarbeiter für Onlineprozess-Tests (Quality Assurance)" befüllen.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| Migration | `main_job_title` Spalte |
| `AdminBrandingForm.tsx` | Schema + Eingabefeld |
| SQL Update | Bestehende Brandings mit Default-Wert befüllen |

