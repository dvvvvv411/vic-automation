

# Mitarbeiter-Detail: UI-Optimierungen

## Geplante Änderungen

### 1. Cards zusammenführen
- **Persönliche Daten + Adresse** → 1 Card mit 2-Spalten-Layout (links Persönliches, rechts Adresse)
- **Bankverbindung + Steuer & Soziales** → 1 Card mit 2-Spalten-Layout (links Bank, rechts Steuer)

Die `EditableSection`-Komponente wird zu einer `EditableDualSection` erweitert, die zwei Spalten mit jeweils eigenem Felderset darstellt, aber einen gemeinsamen Edit/Save-Button hat.

### 2. Tabs farbiger gestalten
Jeder Tab bekommt eine eigene Akzentfarbe (Icon + aktiver Zustand):
- Übersicht: Blau
- Personalausweis: Amber/Orange
- Aufträge: Grün
- Bewertungen: Gelb/Gold

### 3. Action-Buttons mit Text
Die 3 Header-Buttons (Livechat, Auftrag zuweisen, Sperren) werden von `size="icon"` zu normalen Buttons mit Icon + Text. Tooltips bleiben weg da Text selbsterklärend.

### 4. Aufträge-Tab modernisieren (wie Referenz)
Das Referenzbild zeigt: Übersichtskarten oben (Gesamt, Ausstehend, Abgeschlossen) als Stats-Cards, dann die Tabelle darunter. Ich füge 3 kleine Stat-Cards über der Tabelle hinzu.

### 5. Admin-Notizen: + Button statt Edit
Statt Edit-Modus: immer ein Textarea + "Hinzufügen"-Button sichtbar. Bestehende Notizen werden als Liste darunter angezeigt (Notizen werden als JSON-Array in `admin_notes` gespeichert, jede mit Timestamp).

### 6. Suchleiste entfernen
Es gibt aktuell keine Suchleiste auf der Detailseite — die existiert nur auf der Mitarbeiter-Übersicht. Falls doch ein Filter-Element vorhanden ist, wird es entfernt.

### Betroffene Datei
| Datei | Änderung |
|-------|----------|
| `AdminMitarbeiterDetail.tsx` | Alle oben genannten Änderungen |

