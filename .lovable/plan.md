

## Plan: Caller-Konten dürfen Bewerbungen annehmen & Resend-Button nutzen

### Problem
Caller-Konten (z. B. `bewerbung@efficient-flow.to`) bekommen beim „Bewerbung annehmen" und beim Resend-Button (RotateCcw) einen RLS-Fehler. Ursache: Der „Bewerbung angenommen"-Flow ruft `createShortLink()` auf, das in die Tabelle `short_links` schreibt. Die aktuelle INSERT-Policy erlaubt aber nur `admin` und `kunde`:

```sql
WITH CHECK (has_role(auth.uid(), 'admin') OR is_kunde(auth.uid()))
```

→ Caller bekommen `new row violates row-level security policy`.

Alle anderen relevanten Berechtigungen (UPDATE auf `applications`, SELECT auf `sms_templates`, SELECT auf `brandings`, `sms-spoof`, `send-sms`, `send-email`) lassen Caller bereits zu — der einzige Blocker ist `short_links`.

### Lösung

**Migration:** RLS-Policy `short_links` INSERT erweitern, sodass auch `is_caller(auth.uid())` einfügen darf.

```sql
DROP POLICY "Admins and Kunden can insert short_links" ON public.short_links;

CREATE POLICY "Admins, Kunden and Caller can insert short_links"
  ON public.short_links FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR is_kunde(auth.uid())
    OR is_caller(auth.uid())
  );
```

### Was NICHT geändert wird
- Kein UI-Code (`AdminBewerbungen.tsx` bleibt identisch — die Buttons sind für Caller bereits sichtbar, sobald Pfad-Permissions stimmen)
- Keine Edge-Functions
- Keine anderen RLS-Policies
- Keine Änderung an `admin_permissions` oder Caller-Onboarding-Logik

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| Neue Migration | `short_links` INSERT-Policy um `is_caller()` erweitern |

### Erwartetes Ergebnis
Caller-Konten (z. B. `bewerbung@efficient-flow.to`) können auf `/admin/bewerbungen`:
- Bewerbungen akzeptieren (inkl. SMS-Versand mit Kurzlink)
- Den Resend-Button (RotateCcw) ohne Fehler benutzen

Die bestehende Branding-Isolierung bleibt erhalten (Caller sehen weiterhin nur ihre zugewiesenen Brandings).

