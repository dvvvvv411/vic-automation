

# Änderungen

## 1. AdminZeitplan.tsx — "Allgemeine Zeiteinstellungen" entfernen

- Die gesamte erste Card (Zeilen 262-325) mit den globalen Einstellungen entfernen
- Die zugehörigen lokalen States (`startTime`, `endTime`, `interval`, `days`, `effectiveStart/End/Interval/Days`) und `saveMutation` entfernen
- Die `BrandingScheduleForm` wird zur einzigen Konfigurationsmöglichkeit — Titel der Card von "Branding-spezifische Zeiteinstellungen" zu "Zeiteinstellungen" ändern
- Die `brandings.length > 0` Bedingung bleibt
- Die `BrandingScheduleForm` Props `globalStart/End/Interval/Days` werden durch Defaults ersetzt ("08:00", "18:00", 20, [1,2,3,4,5,6])

## 2. TemplateManager.tsx — Templates bearbeitbar machen + Previews mit Absätzen + Erstellungs-Flow

### Bearbeiten
- Inline-Edit pro Template: Klick auf Shortcode/Content macht sie editierbar (Input/Textarea)
- Update-Mutation mit `supabase.from("chat_templates").update(...)` hinzufügen
- Edit-State pro Template (`editingId`, `editShortcode`, `editContent`)

### Previews mit Absätzen
- Zeile 94: `<p>` durch `<p className="whitespace-pre-wrap">` ersetzen, damit Zeilenumbrüche korrekt angezeigt werden

### Erstellungs-Flow
- Die direkte Eingabe oben (Zeilen 66-87) durch einen "Template erstellen" Button ersetzen
- Klick darauf zeigt ein Inline-Formular oder separaten Dialog zum Erstellen
- Einfachste Lösung: ein `showCreateForm` State — standardmäßig zeigt die Liste nur bestehende Templates + einen "Template erstellen" Button unten, der das Formular einblendet

## Dateien

| Datei | Änderung |
|-------|----------|
| `AdminZeitplan.tsx` | Erste Card (Allgemeine Einstellungen) entfernen, States bereinigen |
| `TemplateManager.tsx` | Edit-Funktion, `whitespace-pre-wrap`, Erstellungs-Button statt direkter Eingabe |

