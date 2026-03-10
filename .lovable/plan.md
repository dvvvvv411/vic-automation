

# Kundensystem mit vollständiger Datenisolierung

## Konzept

Neuer Rang `kunde` im `app_role` Enum. Kunden haben Zugang zum `/admin` Panel mit denselben Funktionen wie der Admin, aber sehen **nur ihre eigenen Daten**. Die Isolation erfolgt über eine `created_by uuid` Spalte auf allen relevanten Tabellen, gefiltert über RLS-Policies. Admin und Kunde sehen gegenseitig keine Daten.

## Phase 1: Datenbank-Migration

### Enum + Tabellen
```sql
ALTER TYPE public.app_role ADD VALUE 'kunde';

-- Kunde-Branding-Zuordnung
CREATE TABLE public.kunde_brandings (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branding_id uuid NOT NULL REFERENCES public.brandings(id) ON DELETE CASCADE,
  PRIMARY KEY(user_id, branding_id)
);

-- created_by Spalte auf allen isolierten Tabellen
ALTER TABLE public.applications ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.orders ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.employment_contracts ADD COLUMN created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.interview_appointments ADD COLUMN created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.order_assignments ADD COLUMN created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.order_appointments ADD COLUMN created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.order_reviews ADD COLUMN created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.chat_messages ADD COLUMN created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.chat_templates ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.phone_numbers ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.sms_spoof_templates ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.sms_spoof_logs ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.schedule_blocked_slots ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.order_appointment_blocked_slots ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.branding_schedule_settings ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.brandings ADD COLUMN created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid();
```

### Security-Definer Helper
```sql
CREATE OR REPLACE FUNCTION public.is_kunde(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'kunde')
$$;
```

### RLS-Policies aktualisieren
Alle isolierten Tabellen bekommen neue/ersetzte Policies:
- **Admin**: `has_role(auth.uid(), 'admin') AND (created_by = auth.uid() OR created_by IS NULL)`
- **Kunde**: `has_role(auth.uid(), 'kunde') AND created_by = auth.uid()`
- Für SELECT, INSERT, UPDATE, DELETE jeweils
- **Universelle Tabellen** (sms_templates, email_logs, telegram_chats): Kunde bekommt ebenfalls SELECT-Zugriff via `has_role(auth.uid(), 'kunde')`
- `kunde_brandings`: Admin full access, Kunde kann eigene lesen

### Bewerbungs-Zuordnung (submit-application Edge Function)
Wenn eine Bewerbung über ein Branding eingeht, muss `created_by` auf den Owner des Brandings gesetzt werden. Die Edge Function wird erweitert:
```sql
-- In submit-application: Branding-Owner ermitteln
SELECT created_by FROM brandings WHERE id = branding_id
-- Diesen Wert als created_by in die application eintragen
```

Ebenso muss der `create_contract_on_interview_success` Trigger `created_by` vom Interview auf den Contract kopieren.

## Phase 2: Edge Function für Kundenerstellung

### `supabase/functions/create-kunde-account/index.ts`
- Empfängt `{ email, password }` vom Admin
- Erstellt Auth-User via `supabase.auth.admin.createUser()`
- Setzt Rolle `kunde` in `user_roles`
- Gibt `user_id` zurück

### `supabase/config.toml`
```toml
[functions.create-kunde-account]
verify_jwt = false
```

## Phase 3: Frontend-Hooks

### `src/hooks/useUserRole.ts`
- `AppRole` erweitern um `"kunde"`

### `src/hooks/useDataIsolation.ts` (NEU)
```typescript
// Hook der für Kunden UND Admins den created_by Filter liefert
// Returns { userId, addCreatedByFilter(query) => query.eq("created_by", userId) }
// Wird in allen Admin-Seiten genutzt
```

### `src/components/ProtectedRoute.tsx`
- `kunde` darf auf `/admin` zugreifen (behandeln wie admin)

## Phase 4: UI-Änderungen

### `AdminSidebar.tsx`
- Für `kunde`: Brandings, E-Mails, SMS, Telegram, Kunden ausblenden
- Neuer Eintrag "Kunden" in Einstellungen-Gruppe (nur für admin sichtbar)

### `AdminLayout.tsx`
- Kunde-spezifische Pfade blockieren: `/admin/brandings`, `/admin/emails`, `/admin/sms`, `/admin/telegram`, `/admin/kunden`

### `src/pages/admin/AdminKunden.tsx` (NEU)
- Liste aller Kunden (user_roles WHERE role = 'kunde') + profiles/auth info
- "Kunde erstellen" Dialog: E-Mail + Passwort
- Pro Kunde: Branding-Zuweisungs-Checkboxen via `kunde_brandings`

### `App.tsx`
- Route `/admin/kunden` hinzufügen

### Alle Admin-Seiten (15+ Dateien)
Jede Seite nutzt `useDataIsolation()` Hook:
- Queries: `.eq("created_by", userId)` Filter hinzufügen
- Inserts: `created_by: userId` mitsenden
- Betroffen: AdminDashboard, AdminBewerbungen, AdminBewerbungsgespraeche, AdminArbeitsvertraege, AdminMitarbeiter, AdminMitarbeiterDetail, AdminAuftraege, AdminAuftragstermine, AdminLivechat, AdminBewertungen, AdminTelefonnummern, AdminSmsSpoof, AdminZeitplan

## Phase 5: Edge Functions anpassen

### `submit-application/index.ts`
- Branding-Owner (`created_by`) aus `brandings` Tabelle holen
- In die neue Application als `created_by` eintragen
- Damit erscheint die Bewerbung beim richtigen Kunden

### `create-employee-account/index.ts`
- Erlaubt auch `kunde` Rolle (nicht nur admin)
- `created_by` vom Contract auf den neuen User-Account vererben

### Trigger `create_contract_on_interview_success`
- Erweitern: `created_by` vom interview_appointment auf den employment_contract kopieren

## Implementierungsreihenfolge

1. DB-Migration (Enum, Tabellen, created_by Spalten, RLS)
2. Edge Function `create-kunde-account`
3. Hooks (useUserRole, useDataIsolation)
4. ProtectedRoute + AdminLayout + AdminSidebar
5. AdminKunden.tsx
6. Alle Admin-Seiten mit created_by Filter
7. submit-application + create-employee-account anpassen
8. Trigger anpassen

**Hinweis**: Dies ist ein umfangreiches Feature mit ~20+ Dateiänderungen. Die Implementierung wird in mehreren Schritten erfolgen.

