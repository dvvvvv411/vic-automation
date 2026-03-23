

## Notizfeld fuer Bewerbungsgespraeche & Probetag

### Ziel
Ein gemeinsames Notizfeld pro Branding auf den Seiten `/admin/bewerbungsgespraeche` und `/admin/probetag`, sichtbar fuer alle Nutzer (Admin, Kunde, Caller) die dem Branding zugewiesen sind. Notizen werden mit Timestamp und Email des Verfassers gespeichert.

### Aenderungen

**1. DB-Migration: Neue Tabelle `branding_notes`**

```sql
CREATE TABLE public.branding_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branding_id uuid NOT NULL,
  page_context text NOT NULL,  -- 'bewerbungsgespraeche' oder 'probetag'
  content text NOT NULL,
  author_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.branding_notes ENABLE ROW LEVEL SECURITY;

-- Lesen: Admin, Kunde mit Branding-Zugang, Caller mit Branding-Zugang
CREATE POLICY "Users can read branding_notes" ON public.branding_notes
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    (is_kunde(auth.uid()) AND (NOT user_has_any_branding(auth.uid()) OR branding_id IN (SELECT user_branding_ids(auth.uid())))) OR
    (is_caller(auth.uid()) AND branding_id IN (SELECT user_branding_ids(auth.uid())))
  );

-- Schreiben: gleiche Logik
CREATE POLICY "Users can insert branding_notes" ON public.branding_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR is_kunde(auth.uid()) OR is_caller(auth.uid())
  );

-- Loeschen: nur eigene Notizen
CREATE POLICY "Users can delete own branding_notes" ON public.branding_notes
  FOR DELETE TO authenticated
  USING (
    author_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
```

**2. Neue Komponente `src/components/admin/BrandingNotes.tsx`**
- Props: `brandingId: string`, `pageContext: "bewerbungsgespraeche" | "probetag"`
- Query: Laedt Notizen aus `branding_notes` gefiltert nach `branding_id` und `page_context`, sortiert nach `created_at DESC`
- Input: Textarea + "Hinzufuegen" Button
- Beim Speichern: Email des aktuellen Users aus `auth.getUser()` holen, INSERT in `branding_notes`
- Anzeige: Jede Notiz mit Zeitstempel und Email, optional Loeschen-Button fuer eigene Notizen
- Platzierung: Unter dem Untertitel "Termine von heute und morgen", vor den View-Toggle-Buttons

**3. `AdminBewerbungsgespraeche.tsx` (Zeile 291)**
- Nach dem `</motion.div>` Block die `<BrandingNotes>` Komponente einfuegen mit `pageContext="bewerbungsgespraeche"`

**4. `AdminProbetag.tsx` (Zeile 150)**
- Nach dem `</motion.div>` Block die `<BrandingNotes>` Komponente einfuegen mit `pageContext="probetag"`

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| Migration | Neue Tabelle `branding_notes` mit RLS |
| `src/components/admin/BrandingNotes.tsx` | Neue Komponente |
| `AdminBewerbungsgespraeche.tsx` | BrandingNotes einbinden |
| `AdminProbetag.tsx` | BrandingNotes einbinden |

