

# Eigene `branding_id`-Spalte für Mitarbeiter (employment_contracts)

## Was wird gemacht

### 1. Datenbank-Migration
- Neue Spalte `branding_id` (uuid, nullable) auf `employment_contracts` hinzufügen
- Backfill: Alle bestehenden Contracts bekommen die `branding_id` aus ihrer verknüpften `applications`-Zeile:
  ```sql
  UPDATE employment_contracts ec
  SET branding_id = a.branding_id
  FROM applications a
  WHERE a.id = ec.application_id;
  ```
- Optional: Trigger erstellen, der bei neuen Contracts automatisch die `branding_id` aus der Application übernimmt

### 2. RLS-Policies vereinfachen
- Die Funktion `apps_for_branding_ids()` wird in den Kunde-Policies für `employment_contracts` nicht mehr gebraucht
- Stattdessen direkt: `branding_id IN (SELECT user_branding_ids(auth.uid()))`
- Gleiche Vereinfachung für `contracts_for_branding_ids()` — kann jetzt direkt auf `employment_contracts.branding_id` filtern statt über den Applications-Join

### 3. Frontend anpassen
- **AdminBewertungen.tsx**: Reviews über `contract_id` → `employment_contracts.branding_id` filtern statt über `orders.branding_id`
- **AdminLivechat.tsx**: Contracts direkt per `.eq("branding_id", activeBrandingId)` laden statt über `applications!inner`-Join
- **AdminMitarbeiter.tsx** und andere Seiten die `applications!inner(branding_id)` nutzen: vereinfachen auf direkte `branding_id`-Abfrage
- **SECURITY DEFINER Funktionen** `apps_for_branding_ids` und `contracts_for_branding_ids` aktualisieren, damit sie die neue direkte Spalte nutzen

### Betroffene Dateien
- 1 SQL-Migration (Spalte + Backfill + Trigger + Policy-Updates + Funktions-Updates)
- `src/pages/admin/AdminBewertungen.tsx`
- `src/pages/admin/AdminLivechat.tsx`
- Weitere Admin-Seiten die den `applications!inner`-Join für Branding nutzen

