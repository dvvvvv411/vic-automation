

## Plan: Fehlgeschlagen-Popup mit Grund und automatischer Notiz

### Aenderung

**`AdminBewerbungsgespraeche.tsx`**:

1. Neuen State `failTarget` fuer das Popup (speichert item + Grund-Text)
2. Beim Klick auf XCircle-Button: statt direkt `handleStatusUpdate` aufzurufen, `failTarget` setzen → Dialog oeffnet sich
3. Neuer Dialog mit Textarea fuer den Grund
4. Bei Bestaetigung:
   - `handleStatusUpdate(item, "fehlgeschlagen")` ausfuehren
   - Notiz in `branding_notes` einfuegen mit Content: `"{Vorname} {Nachname} — Fehlgeschlagen: {Grund}"`, `page_context: "bewerbungsgespraeche"`, `branding_id` aus der Application
   - `branding-notes` Query invalidieren
   - Dialog schliessen

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `AdminBewerbungsgespraeche.tsx` | State + Dialog + Notiz-Insert bei Fehlgeschlagen |

