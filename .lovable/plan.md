

## Fix: Alle Nutzer koennen alle Notizen loeschen

### Problem
Die aktuelle RLS DELETE-Policy erlaubt nur das Loeschen eigener Notizen (per `author_email`-Vergleich). Der User moechte, dass alle berechtigten Nutzer (Admin, Kunde, Caller) alle Notizen loeschen koennen.

### Aenderung

**1. DB-Migration: DELETE-Policy ersetzen**

Alte Policy droppen und neue erstellen, die dieselbe Logik wie die SELECT-Policy nutzt:

```sql
DROP POLICY "Users can delete own branding_notes" ON public.branding_notes;

CREATE POLICY "Users can delete branding_notes" ON public.branding_notes
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (is_kunde(auth.uid()) AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid()))))
    OR (is_caller(auth.uid()) AND branding_id IN (SELECT user_branding_ids(auth.uid())))
  );
```

Keine Code-Aenderungen noetig — die Frontend-Komponente `BrandingNotes.tsx` zeigt dann den Loeschen-Button fuer alle Notizen (nicht nur eigene).

**2. `BrandingNotes.tsx` — Loeschen-Button fuer alle anzeigen**

Aktuell wird der Button nur angezeigt wenn `currentEmail === note.author_email`. Diese Bedingung entfernen, damit jeder den Button sieht.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| Migration | DELETE-Policy ersetzen |
| `BrandingNotes.tsx` | Loeschen-Button-Bedingung entfernen |

