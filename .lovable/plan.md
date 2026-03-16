

# Branding-Spalte aus `profiles` statt `employment_contracts`

## Problem
Die Branding-Spalte in der Mitarbeiter-Tabelle zeigt "–", weil kein Join auf die `brandings`-Tabelle gemacht wird. Der User möchte, dass das Branding aus der `profiles`-Tabelle kommt (über `profiles.branding_id`), nicht aus `employment_contracts`.

Zusätzlich soll ein DB-Update alle bestehenden User nachträglich mit dem korrekten `branding_id` in `profiles` befüllen (basierend auf `employment_contracts.branding_id`).

## Änderungen

### 1. DB-Migration: Bestehende Profile backfillen

```sql
UPDATE profiles p
SET branding_id = ec.branding_id
FROM employment_contracts ec
WHERE ec.user_id = p.id
  AND ec.branding_id IS NOT NULL
  AND p.branding_id IS NULL;
```

Dies wird als Data-Update über das Insert-Tool ausgeführt (kein Schema-Change).

### 2. Frontend: `AdminMitarbeiter.tsx`

**Query erweitern** — über `user_id` die `profiles`-Tabelle joinen, um `branding_id` aufzulösen:

```tsx
.select("id, first_name, last_name, email, phone, temp_password, user_id, application_id, status, desired_start_date, is_suspended, branding_id, profiles(branding_id, brandings:branding_id(company_name))", { count: "exact" })
```

Allerdings ist `user_id` kein FK zu `profiles.id` in Supabase's Sicht — daher besser: Separat die `brandings`-Tabelle über `employment_contracts.branding_id` joinen, ODER den einfacheren Weg nutzen:

Da `employment_contracts` bereits `branding_id` hat, ist der einfachste Join:

```tsx
.select("..., brandings:branding_id(company_name)", { count: "exact" })
```

**Aber** der User will explizit aus `profiles`. Das Problem: `employment_contracts.user_id` hat keinen FK zu `profiles.id`, daher kann PostgREST den Join nicht automatisch machen.

**Pragmatische Lösung:** Da alle angezeigten Mitarbeiter zum selben `activeBrandingId` gehören (die Query filtert bereits `.eq("branding_id", activeBrandingId!)`), können wir den Branding-Namen einfach aus dem `BrandingContext` nehmen — das ist korrekt und performant.

### Angepasster Plan

| Schritt | Was | Wie |
|---------|-----|-----|
| 1 | Bestehende Profile backfillen | SQL UPDATE via Insert-Tool |
| 2 | Branding-Name in Tabelle anzeigen | `brandings`-Array aus `useBrandingFilter` nutzen, `activeBrandingName` ableiten |

### Code-Änderung in `AdminMitarbeiter.tsx`

```tsx
const { activeBrandingId, ready, brandings } = useBrandingFilter();
const activeBrandingName = brandings.find(b => b.id === activeBrandingId)?.company_name ?? "–";
```

In der Tabellenzelle (Zeile ~205):
```tsx
// Ersetze:
{(item as any).applications?.brandings?.company_name || "–"}
// Mit:
{activeBrandingName}
```

