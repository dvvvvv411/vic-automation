

# Link-Spalte in Admin Arbeitsvertraege + Anon-Zugriff sicherstellen

## Uebersicht

In der Tabelle auf `/admin/arbeitsvertraege` wird eine neue Spalte "Link" hinzugefuegt, mit einem Button zum Kopieren des Arbeitsvertrag-Links (`/arbeitsvertrag/{application_id}`). Der oeffentliche Zugriff auf das Formular ist bereits korrekt konfiguriert (Anon SELECT/UPDATE Policies + SECURITY DEFINER RPCs + Storage Policies vorhanden).

## Aenderung

### `src/pages/admin/AdminArbeitsvertraege.tsx`

- Neue Spalte **"Link"** in der Tabelle (zwischen "Branding" und "Vertragsstatus")
- Button mit Copy-Icon, der `window.location.origin + "/arbeitsvertrag/" + application_id` in die Zwischenablage kopiert
- Toast-Benachrichtigung bei erfolgreichem Kopieren
- Import von `Copy` Icon aus lucide-react

### Keine Datenbank-Aenderungen noetig

Die RLS-Policies und Storage-Policies erlauben bereits anonymen Zugriff:
- `employment_contracts`: Anon SELECT + UPDATE
- `applications`: Anon SELECT
- `brandings`: Anon SELECT
- Storage `contract-documents`: Anon Upload + View
- RPCs mit SECURITY DEFINER umgehen RLS

