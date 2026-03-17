

## Plan: Caller-Rolle implementieren

### Uebersicht

Neuer Rang "caller" im System. Caller sind eingeschraenkte Admin-Accounts die nur Zugriff auf entweder `/admin/bewerbungsgespraeche` oder `/admin/probetag` haben. Verwaltung ueber `/admin/caller`.

### 1. Datenbank-Aenderungen

**Migration 1: app_role Enum erweitern + Hilfsfunktion**

```sql
ALTER TYPE public.app_role ADD VALUE 'caller';

CREATE OR REPLACE FUNCTION public.is_caller(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'caller') $$;
```

**Migration 2: RLS-Policies aktualisieren**

Caller muessen auf dieselben Tabellen zugreifen wie Kunden, aber nur fuer ihre zugewiesenen Brandings. Die bestehenden RLS-Policies fuer `applications`, `interview_appointments`, `trial_day_appointments`, `employment_contracts`, `brandings`, `ident_sessions` etc. muessen um `is_caller()` Checks erweitert werden (analog zu `is_kunde()`).

Beispiel-Pattern fuer jede betroffene Policy:
```sql
-- Bestehend: ... OR (is_kunde(auth.uid()) AND (...branding check...))
-- Neu:       ... OR (is_caller(auth.uid()) AND (...branding check...))
```

Betroffene Tabellen: `applications`, `interview_appointments`, `trial_day_appointments`, `employment_contracts`, `brandings`, `email_logs`, `sms_logs`, `branding_schedule_settings`, `schedule_blocked_slots`.

Caller nutzen ebenfalls `kunde_brandings` fuer die Branding-Zuweisung (kein neuer Table noetig), also greift `user_branding_ids()` automatisch.

### 2. Edge Function: `create-caller-account`

Neue Edge Function analog zu `create-kunde-account`:
- Erstellt Auth-User mit Email/Passwort
- Loescht auto-erstellte 'user'-Rolle, setzt 'caller'
- Fuegt `admin_permissions` Eintrag ein (entweder `/admin/bewerbungsgespraeche` oder `/admin/probetag`)
- Fuegt `kunde_brandings` Eintraege fuer zugewiesene Brandings ein

Input: `{ email, password, callerType: "bewerbungsgespraeche" | "probetag", brandingIds: string[] }`

### 3. Frontend-Aenderungen

| Datei | Aenderung |
|---|---|
| `src/hooks/useUserRole.ts` | `isCaller` Property hinzufuegen, 'caller' als AppRole |
| `src/components/ProtectedRoute.tsx` | 'caller' in allowedRoles fuer /admin |
| `src/App.tsx` | Route `/admin/caller` + Import, ProtectedRoute um 'caller' erweitern |
| `src/contexts/BrandingContext.tsx` | `isCaller` behandeln (Brandings aus `kunde_brandings` laden, wie Kunde) |
| `src/components/admin/AdminSidebar.tsx` | Caller-Rolle behandeln: nur erlaubte Pfade zeigen, Branding-Switcher anzeigen |
| `src/components/admin/AdminLayout.tsx` | 'caller' Rolle erlauben, Pfad-Blocking fuer Caller analog zu Kunde |
| `src/pages/admin/AdminCaller.tsx` | **Neue Seite**: Caller-Konten verwalten (Liste + Erstellen-Dialog mit Email, Passwort, Typ-Auswahl, Branding-Zuweisung) |

**AdminSidebar Caller-Logik:**
- Wenn `isCaller`: Alle Nav-Items ausblenden ausser dem erlaubten Pfad (via `useAdminPermissions`)
- Kein "Uebersicht"-Link, kein Einstellungen-Bereich
- Branding-Switcher bleibt sichtbar

**AdminLayout Caller-Logik:**
- Caller die auf nicht-erlaubte Pfade navigieren werden zum erlaubten Pfad redirected
- Laedt synchron mit Permissions, kein Flackern (wie bei bestehenden admin_permissions)

**AdminCaller.tsx UI:**
- Aehnlich wie AdminKunden: Card-Liste der Caller
- Erstellen-Dialog: Email, Passwort, Radio-Button (Bewerbungsgespraeche / Probetage), Branding-Checkboxen
- Anzeige: Name, Typ-Badge, zugewiesene Brandings
- Loeschen-Button

### 4. Keine Flicker-Garantie

Die bestehende `useAdminPermissions`-Logik blockiert bereits das Rendering bis Permissions geladen sind. Da Caller ihre `admin_permissions` Eintraege haben, wird die Sidebar sofort korrekt gerendert ohne nachtraegliches Ausblenden.

### Betroffene Dateien (Zusammenfassung)

| Datei | Art |
|---|---|
| DB Migration (app_role + is_caller + RLS) | Neu |
| `supabase/functions/create-caller-account/index.ts` | Neu |
| `src/pages/admin/AdminCaller.tsx` | Neu |
| `src/hooks/useUserRole.ts` | Aendern |
| `src/components/ProtectedRoute.tsx` | Aendern |
| `src/App.tsx` | Aendern |
| `src/contexts/BrandingContext.tsx` | Aendern |
| `src/components/admin/AdminSidebar.tsx` | Aendern |
| `src/components/admin/AdminLayout.tsx` | Aendern |

