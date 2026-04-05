
## Plan: Kopier-Button für Original-API-Link bei Telefonnummern

### Änderung

**Datei:** `src/pages/admin/AdminTelefonnummern.tsx`

In der `PhoneRow`-Komponente wird neben dem Löschen-Button ein weiterer Icon-Button hinzugefügt, der `entry.api_url` in die Zwischenablage kopiert und einen Toast zeigt.

- Icon: `Link` aus lucide-react
- Position: vor dem Trash-Button in der letzten TableCell
- Toast: "Link kopiert"

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminTelefonnummern.tsx` | Kopier-Button für `api_url` in jeder Zeile |
