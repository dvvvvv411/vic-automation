

# Tabs für Bewertungen: "In Überprüfung" und "Genehmigt"

## Änderung

**Datei: `src/pages/admin/AdminBewertungen.tsx`**

1. `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` importieren
2. Die bestehende Tabelle in zwei Tabs aufteilen:
   - **Tab "In Überprüfung"**: Zeigt nur Bewertungen mit `assignment_status` gleich `"in_pruefung"` oder `"offen"` (alles was nicht `erfolgreich`/`fehlgeschlagen` ist)
   - **Tab "Genehmigt"**: Zeigt nur Bewertungen mit `assignment_status === "erfolgreich"`
3. Jeder Tab rendert dieselbe Tabellenstruktur, aber mit gefiltertem `grouped`-Array
4. Im "Genehmigt"-Tab werden die Approve/Reject-Buttons nicht angezeigt (passiert bereits durch die bestehende Bedingung)

