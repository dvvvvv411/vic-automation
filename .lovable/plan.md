

## Plan: Speichern-Button auf jedem Schritt

In `src/pages/admin/AdminAuftragWizard.tsx` wird im Navigation-Bereich unten auf **jedem** Schritt (nicht nur dem letzten) ein zusätzlicher "Speichern"-Button neben dem "Weiter"-Button eingefügt.

Konkret: Der bestehende Speichern-Button (aktuell nur auf Schritt 4) wird auf alle Schritte erweitert. Die Footer-Leiste zeigt dann immer:
- Links: Zurück-Button
- Rechts: Speichern-Button + Weiter-Button (bzw. auf dem letzten Schritt nur den Speichern-Button)

Der Speichern-Button nutzt die bereits vorhandene `saveMutation` und `canSave`-Logik.

