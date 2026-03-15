

# Branding-Zuweisung für selbst-registrierte User (Rolle "user")

## Klarstellung
Nutzer die sich über /auth registrieren bekommen die Rolle **"user"** (Mitarbeiter-Panel), nicht "kunde". Die `kunde_brandings`-Tabelle ist daher **nicht** der richtige Ort — die ist für Admin/Kunde-Zugriffskontrolle.

## Problem
Reguläre User bekommen ihr Branding aktuell über die Kette `employment_contract → application → branding_id`. Selbst-registrierte User haben aber noch keinen Arbeitsvertrag und damit keine Branding-Zuordnung.

## Lösung
`branding_id` auf der `profiles`-Tabelle speichern. Damit hat jeder selbst-registrierte User direkt eine Branding-Zuordnung.

### 1. Migration — `branding_id` auf `profiles`
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branding_id uuid;
```

### 2. Auth.tsx — `branding_id` im Fetch mitspeichern + nach signUp ins Profil schreiben
- Im bestehenden `fetchBranding` die `id` mit abfragen und in State `brandingId` speichern (wird bereits für Logo genutzt)
- Nach erfolgreichem `signUp`: das Profil updaten mit `branding_id`

```tsx
// nach signUp
if (!error && data.user && brandingId) {
  await supabase
    .from("profiles")
    .update({ branding_id: brandingId })
    .eq("id", data.user.id);
}
```

### 3. MitarbeiterLayout — Fallback auf `profiles.branding_id`
Wenn kein Contract/Application existiert, das Branding aus `profiles.branding_id` laden als Fallback.

## Betroffene Dateien
1. Migration — `branding_id` Spalte auf `profiles`
2. `src/pages/Auth.tsx` — branding_id speichern bei Registrierung
3. `src/components/mitarbeiter/MitarbeiterLayout.tsx` — Fallback-Branding aus Profil

