

# Datenisolierung: `created_by` entfernen, nur Branding-basiert

## Überblick
Alle RLS-Policies und Frontend-Queries werden von `created_by = auth.uid()` auf `branding_id IN (SELECT user_branding_ids(auth.uid()))` umgestellt. Jeder User sieht die Daten aller Brandings, denen er zugewiesen ist — unabhängig davon, wer den Datensatz erstellt hat.

## Phase 1: DB-Schema — `branding_id` hinzufügen

Tabellen die `branding_id` brauchen:
| Tabelle | Aktuell | Änderung |
|---|---|---|
| `phone_numbers` | nur `created_by` | + `branding_id uuid REFERENCES brandings(id)` |
| `orders` | nur `created_by` | + `branding_id uuid REFERENCES brandings(id)` |
| `chat_templates` | nur `created_by` | + `branding_id uuid REFERENCES brandings(id)` |
| `sms_spoof_templates` | nur `created_by` | + `branding_id uuid REFERENCES brandings(id)` |
| `sms_spoof_logs` | nur `created_by` | + `branding_id uuid REFERENCES brandings(id)` |

## Phase 2: RLS-Policies komplett neu schreiben

### Muster A — Tabellen mit direktem `branding_id`
Betrifft: `applications`, `brandings`, `branding_schedule_settings`, `schedule_blocked_slots`, `trial_day_blocked_slots`, `order_appointment_blocked_slots`, `phone_numbers`, `orders`, `chat_templates`, `sms_spoof_templates`, `sms_spoof_logs`

```sql
-- Admin/Kunde SELECT: sieht Daten seiner zugewiesenen Brandings
USING (branding_id IN (SELECT user_branding_ids(auth.uid())))

-- Admin ohne Branding-Zuweisung (Superadmin): sieht alles
-- Fallback: wenn user_branding_ids leer → keine Einschränkung
```

### Muster B — Tabellen mit indirektem Branding über `application_id`
Betrifft: `interview_appointments`, `trial_day_appointments`, `employment_contracts`

```sql
USING (application_id IN (
  SELECT id FROM applications 
  WHERE branding_id IN (SELECT user_branding_ids(auth.uid()))
))
```

### Muster C — Tabellen mit indirektem Branding über `contract_id`
Betrifft: `chat_messages`, `order_assignments`, `order_reviews`, `order_appointments`

```sql
USING (contract_id IN (
  SELECT ec.id FROM employment_contracts ec
  JOIN applications a ON a.id = ec.application_id
  WHERE a.branding_id IN (SELECT user_branding_ids(auth.uid()))
))
```

### Superadmin-Logik
Admins ohne Einträge in `kunde_brandings` sehen weiterhin ALLE Daten (Rückwärtskompatibilität). Neue Security-Definer-Funktion:

```sql
CREATE FUNCTION user_has_any_branding(_user_id uuid) RETURNS boolean
-- true wenn der User mindestens 1 Branding zugewiesen hat
```

RLS-Pattern:
```sql
USING (
  (NOT user_has_any_branding(auth.uid()))  -- Superadmin: kein Branding = alles sehen
  OR branding_id IN (SELECT user_branding_ids(auth.uid()))
)
```

## Phase 3: Frontend umstellen

### Neuer Hook: `useBrandingFilter`
Ersetzt `useUserQueryKey` und `useDataIsolation`:
- Lädt zugewiesene `branding_ids` aus `kunde_brandings`
- Liefert `brandingIds` für Query-Keys und Filter
- Wenn nur 1 Branding → automatisch für Inserts verwenden
- Wenn mehrere → Branding-Selector anzeigen

### ~19 Admin-Seiten anpassen
Jede Seite die `useUserQueryKey` nutzt:
- Query-Key: `["orders", brandingIds]` statt `["orders", userId]`
- Inserts: `branding_id` mitsenden statt `created_by`
- RLS filtert serverseitig — kein client-seitiger `.eq("created_by", ...)` mehr nötig

### Betroffene Dateien
- `src/hooks/useBrandingFilter.ts` (neu)
- `src/pages/admin/AdminAuftraege.tsx` — branding_id bei Insert
- `src/pages/admin/AdminTelefonnummern.tsx` — branding_id bei Insert
- `src/pages/admin/AdminBewerbungen.tsx`
- `src/pages/admin/AdminBewerbungsgespraeche.tsx`
- `src/pages/admin/AdminProbetag.tsx`
- `src/pages/admin/AdminArbeitsvertraege.tsx`
- `src/pages/admin/AdminMitarbeiter.tsx`
- `src/pages/admin/AdminBewertungen.tsx`
- `src/pages/admin/AdminDashboard.tsx`
- `src/pages/admin/AdminLivechat.tsx`
- `src/pages/admin/AdminSmsTemplates.tsx`
- `src/pages/admin/AdminSmsHistory.tsx`
- `src/pages/admin/AdminSmsSpoof.tsx`
- `src/pages/admin/AdminEmails.tsx`
- `src/pages/admin/AdminAuftragstermine.tsx`
- `src/pages/admin/AdminZeitplan.tsx`
- `src/pages/admin/AdminBrandings.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/admin/UpcomingStartDates.tsx`
- `src/pages/Bewerbungsgespraech.tsx` — `created_by` Lookup entfernen
- `src/pages/Probetag.tsx` — `created_by` Lookup entfernen

### Branding-Auswahl bei Multi-Branding Usern
Für Inserts (neue Telefonnummer, neuer Auftrag etc.) braucht der User eine Auswahl, wenn er mehreren Brandings zugewiesen ist. Der `useBrandingFilter`-Hook stellt ein `activeBrandingId` bereit + eine Selector-Komponente.

## Reihenfolge
1. DB-Migration: Spalten + neue RLS-Policies (1 große Migration)
2. `useBrandingFilter`-Hook erstellen
3. Alle Admin-Seiten umstellen (Query-Keys + Inserts)
4. `useDataIsolation` und `useUserQueryKey` entfernen

