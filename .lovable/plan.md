

# Branding-Switcher + Echte Single-Branding-Isolierung

## Problem
Aktuell zeigt das System entweder alle Daten aller zugewiesenen Brandings oder gar keine (wegen RLS-Rekursion). Der User will:
1. **Branding-Switcher** in der Sidebar -- sowohl Admin als auch Kunde müssen aktiv ein Branding auswählen
2. **Admin sieht automatisch ALLE Brandings** (ohne `kunde_brandings`-Einträge)
3. **Immer nur Daten des aktuell gewählten Brandings** anzeigen -- nicht alle gleichzeitig
4. **RLS-Rekursionsproblem fixen** (Policy auf `brandings` referenziert `applications` → `employment_contracts` → Endlosschleife)

## Architektur

### 1. Branding-Context (React Context, global)
Neuer `BrandingContext` der den **aktiven Branding-State** hält:
- Lädt verfügbare Brandings: Admin → alle aus `brandings`-Tabelle; Kunde → nur aus `kunde_brandings`
- Speichert `activeBrandingId` in `localStorage` (persistent über Page-Reloads)
- Alle Admin-Seiten konsumieren `activeBrandingId` statt `brandingIds[]`

### 2. Sidebar Branding-Dropdown
- Über dem "Übersicht"-Reiter: Dropdown mit Firmenname + Logo aller verfügbaren Brandings
- Wechsel setzt `activeBrandingId` und invalidiert alle Queries
- Admin und Kunde sehen denselben Switcher

### 3. RLS-Fix: Rekursion beseitigen
Die Policy `"Users can read assigned branding"` auf der `brandings`-Tabelle verursacht Rekursion weil sie `applications` JOIN `employment_contracts` abfragt, die wiederum `applications` referenzieren.

**Fix**: Security-Definer-Funktion erstellen die RLS bypassed:
```sql
CREATE FUNCTION public.user_can_read_branding(_branding_id uuid, _user_id uuid)
RETURNS boolean SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.employment_contracts ec ON ec.application_id = a.id
    WHERE a.branding_id = _branding_id AND ec.user_id = _user_id
  );
$$;
```
Dann Policy ersetzen:
```sql
DROP POLICY "Users can read assigned branding" ON brandings;
CREATE POLICY "Users can read assigned branding" ON brandings
FOR SELECT TO authenticated
USING (public.user_can_read_branding(id, auth.uid()));
```

### 4. `useBrandingFilter` Hook umbauen
- Statt `brandingIds[]` Array liefert der Hook nur noch `activeBrandingId` (single string)
- Admin: lädt alle Brandings direkt aus `brandings`-Tabelle
- Kunde: lädt aus `kunde_brandings`
- Alle Query-Keys nutzen `activeBrandingId` statt `brandingIds`

### 5. Alle Admin-Seiten umstellen
~20 Seiten die `useBrandingFilter` nutzen:
- Query-Keys: `["orders", activeBrandingId]`
- Select-Queries: `.eq("branding_id", activeBrandingId)` für direkte Tabellen
- Für indirekte Tabellen (z.B. `employment_contracts`): Subquery via `applications.branding_id`
- Inserts: immer `branding_id: activeBrandingId` mitsenden
- Badge-Counts in Sidebar: auch nach `activeBrandingId` filtern

### 6. Betroffene Dateien
- `src/contexts/BrandingContext.tsx` (neu) -- globaler State
- `src/hooks/useBrandingFilter.ts` -- vereinfachen auf Context-Consumer
- `src/components/admin/AdminSidebar.tsx` -- Dropdown + Badge-Queries mit Branding-Filter
- `src/components/admin/AdminLayout.tsx` -- BrandingProvider wrappen
- Alle ~20 Admin-Seiten: Query-Keys + Inserts auf `activeBrandingId`
- 1 DB-Migration: RLS-Fix für `brandings`-Tabelle

### Reihenfolge
1. DB-Migration: Security-Definer-Funktion + Policy-Fix
2. `BrandingContext` erstellen
3. `AdminLayout` wrappen, Sidebar-Dropdown einbauen
4. `useBrandingFilter` auf Context umstellen
5. Alle Admin-Seiten: Queries mit `.eq("branding_id", activeBrandingId)` filtern

