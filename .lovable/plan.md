

# Branding bearbeiten - Edit-Button und Dialog

## Uebersicht
Ein neuer "Bearbeiten"-Button wird in jeder Tabellenzeile der Brandings-Uebersicht hinzugefuegt. Beim Klick oeffnet sich ein Dialog mit allen Feldern (vorausgefuellt), ausser der Branding-ID, die nur angezeigt aber nicht aenderbar ist.

## Aenderungen

**Datei:** `src/pages/admin/AdminBrandings.tsx`

### 1. State fuer Edit-Modus
- Neuer State `editBranding` (das aktuell zu bearbeitende Branding oder `null`)
- Den bestehenden Dialog wiederverwenden: Wenn `editBranding` gesetzt ist, werden die Felder vorausgefuellt und der Submit fuehrt ein UPDATE statt INSERT aus

### 2. Update-Mutation hinzufuegen
- Neue `useMutation` fuer `supabase.from("brandings").update(...)` mit `.eq("id", editBranding.id)`
- Bei Erfolg: Query invalidieren, Dialog schliessen, Toast anzeigen

### 3. Dialog anpassen
- Der bestehende Dialog wird fuer beide Zwecke (Erstellen und Bearbeiten) genutzt
- Titel aendert sich dynamisch: "Neues Branding erstellen" vs. "Branding bearbeiten"
- Button-Text aendert sich: "Branding erstellen" vs. "Branding speichern"
- Im Edit-Modus wird die Branding-ID oben im Dialog als nicht editierbares Feld angezeigt
- Logo-Upload bleibt optional: Wenn kein neues Logo hochgeladen wird, bleibt das bestehende erhalten

### 4. Edit-Button in der Tabelle
- Neuer Button mit Pencil-Icon (aus lucide-react) neben dem Loeschen-Button in jeder Zeile
- Beim Klick: `editBranding` setzen, Formular mit den Werten des Brandings befuellen, Dialog oeffnen

### 5. Dialog-Reset
- Beim Schliessen des Dialogs: `editBranding` auf `null` zuruecksetzen und Formular leeren

## Technische Details

| Aspekt | Detail |
|--------|--------|
| Datei | `src/pages/admin/AdminBrandings.tsx` |
| Neuer Import | `Pencil` aus `lucide-react` |
| Neuer State | `editBranding: Branding oder null` |
| Neue Mutation | `updateMutation` mit `.update().eq("id", ...)` |
| Dialog | Wiederverwendung des bestehenden Dialogs mit dynamischem Titel/Button |

