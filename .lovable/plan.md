

# Badge "Anhänge erforderlich" auf Auftrags-Cards im Mitarbeiter-Panel

## Was wird gemacht

Wenn ein Mitarbeiter die Bewertung eingereicht hat (Status `in_pruefung` oder `erfolgreich`) und der Auftrag `required_attachments` hat (Array nicht leer), soll auf der Auftrags-Card ein Badge angezeigt werden: **"Anhänge erforderlich"** — sofern noch nicht alle Anhänge genehmigt wurden.

## Änderungen in `MitarbeiterAuftraege.tsx`

### 1. Daten erweitern
- Orders-Query: zusätzlich `required_attachments` laden
- Neue Query: `order_attachments` für den Contract laden (Status pro Anhang)
- Im `Assignment`-Interface: `hasRequiredAttachments: boolean`, `attachmentsPending: boolean` hinzufügen

### 2. Logik
- `hasRequiredAttachments`: `required_attachments` Array hat mindestens 1 Eintrag
- `attachmentsPending`: Nicht alle required attachments haben Status `genehmigt` in `order_attachments`
- Badge anzeigen wenn: Bewertung eingereicht (`in_pruefung` oder `erfolgreich`) UND `hasRequiredAttachments` UND `attachmentsPending`

### 3. UI
- Orange/Amber Badge mit Paperclip-Icon unter dem Status-Badge oder im Card-Body: **"Anhänge ausstehend"**

### Betroffene Datei
- `src/pages/mitarbeiter/MitarbeiterAuftraege.tsx`

