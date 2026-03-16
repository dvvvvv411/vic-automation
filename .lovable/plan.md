
Problem bestätigt: Es ist kein RLS-/Datenbankproblem. Im Network-Log sieht man:
- `/admin/mitarbeiter` lädt für das aktive Branding mehrere Mitarbeiter erfolgreich
- das Zuweisungs-Popup fragt aber weiterhin `status=eq.unterzeichnet` ab und bekommt deshalb `[]`

Das heißt: Die Popup-Abfrage läuft noch mit der alten Filterlogik und weicht von der Mitarbeiterliste ab.

Plan

1. Popup-Abfrage an die Mitarbeiterliste angleichen
- In `src/components/admin/AssignmentDialog.tsx` die Mitarbeiter-Query exakt auf dieselben Kriterien wie in `src/pages/admin/AdminMitarbeiter.tsx` bringen:
  - `branding_id = activeBrandingId`
  - `status IN ('offen','eingereicht','genehmigt','unterzeichnet')`
  - `first_name IS NOT NULL`
- Optional dieselbe Sortierung (`created_at desc`) übernehmen, damit beide Listen auch optisch konsistent sind.

2. Filterlogik zentralisieren
- Die sichtbaren Mitarbeiter-Status in eine gemeinsame Konstante/Hilfsfunktion auslagern, damit `/admin/mitarbeiter` und `AssignmentDialog` nicht wieder auseinanderlaufen.
- Ziel: Wenn später die Mitarbeiterliste angepasst wird, zieht das Popup automatisch mit.

3. Query-Cache robuster machen
- Den React-Query-Key für die Popup-Liste eindeutiger machen, z. B. mit `mode`, `brandingId` und einem festen Scope wie `visible-employees`.
- So wird verhindert, dass alte/leere Ergebnisse aus einer früheren Version weiterverwendet werden.

4. Leeren Zustand korrigieren
- Den Text `Keine unterzeichneten Mitarbeiter vorhanden.` ändern in etwas Passendes wie:
  - `Keine Mitarbeiter für dieses Branding vorhanden.`
- Das passt dann zur echten Logik und verwirrt nicht mehr.

5. Nach Umsetzung Verifikation
- Im Kunden-Account auf `/admin/auftraege` einen Auftrag öffnen und prüfen, dass im Popup dieselben Mitarbeiter erscheinen wie auf `/admin/mitarbeiter`.
- Danach die Preview einmal hart neu laden, weil die aktuelle Session laut Network noch den alten `unterzeichnet`-Request verwendet.

Technische Details
- Betroffene Datei: `src/components/admin/AssignmentDialog.tsx`
- Optional zur Vereinheitlichung zusätzlich: `src/pages/admin/AdminMitarbeiter.tsx` (gemeinsame Status-Konstante/Helper)
- Keine Supabase-Migration nötig
- Kein RLS-Fix nötig, da die Mitarbeiterliste die Datensätze bereits erfolgreich lesen kann
