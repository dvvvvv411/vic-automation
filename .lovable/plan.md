

## Plan: Fix /erster-arbeitstag/:id fuer eingeloggte User auf dem Handy

### Problem
Die RLS-Policy auf `employment_contracts` erlaubt der `anon`-Rolle ALLES zu lesen (`qual: true`), aber fuer `authenticated` User gilt: nur Vertraege mit `user_id = auth.uid()` sind sichtbar. Viele Vertraege haben `user_id = NULL`.

Auf dem PC sind die User oft **nicht eingeloggt** (anon) — die Seite funktioniert. Auf dem Handy sind sie **eingeloggt** (authenticated) — die Query gibt nichts zurueck, und sie sehen "Ungueltiger Link" (graue Seite).

### Loesung
Die `authenticated` SELECT-Policy fuer `employment_contracts` erweitern, damit User mit Rolle `user` auch Vertraege sehen koennen, auf die sie direkt per ID zugreifen (fuer die Buchungsseiten). Dies geschieht analog zur bestehenden anon-Policy, aber eingeschraenkt.

**DB-Migration:** Eine neue RLS-Policy hinzufuegen, die authentifizierten Usern erlaubt, einzelne Vertraege per ID zu lesen — auch wenn `user_id` nicht gesetzt ist. Die sicherste Variante: Die bestehende `authenticated`-Policy um eine Bedingung erweitern, die `user`-Rolle Zugriff auf Vertraege gibt, bei denen `user_id IS NULL` ODER `user_id = auth.uid()`.

```sql
DROP POLICY "Admins can select employment_contracts" ON public.employment_contracts;
CREATE POLICY "Admins can select employment_contracts"
ON public.employment_contracts FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (user_id = auth.uid())
  OR (is_kunde(auth.uid()) AND (
    (NOT user_has_any_branding(auth.uid()))
    OR (branding_id IN (SELECT user_branding_ids(auth.uid())))
  ))
  OR (is_caller(auth.uid()) AND (
    branding_id IN (SELECT user_branding_ids(auth.uid()))
  ))
  OR (user_id IS NULL)
);
```

Die letzte Zeile `OR (user_id IS NULL)` erlaubt allen authentifizierten Usern, Vertraege ohne zugewiesenen User zu lesen — genau wie die anon-Policy es bereits tut. Da die anon-Policy ohnehin `true` ist, wird hier kein neues Sicherheitsrisiko geschaffen.

### Betroffene Dateien
| Datei | Aenderung |
|---|---|
| Neue SQL-Migration | SELECT-Policy auf `employment_contracts` erweitern |

Keine Frontend-Aenderungen noetig.

