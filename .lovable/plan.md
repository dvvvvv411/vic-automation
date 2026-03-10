

# Bugfixes: SMS Spoof, Badge-Isolation, Mitarbeiter-Branding-Zuordnung

## Probleme identifiziert

### 1. SMS Spoof funktioniert nicht für Kunde
Die `sms-spoof` Edge Function hat keine Auth-Prüfung und setzt kein `created_by` beim Logging. Die Funktion nutzt den Service-Role-Key zum Einfügen in `sms_spoof_logs`, aber `created_by` wird nie gesetzt (DEFAULT `auth.uid()` greift nicht bei Service-Role).

### 2. Badge bei Arbeitsverträge zeigt 3 obwohl keine da sind
Die RLS-Policy `Anon can select employment_contracts` hat `USING (true)` mit Roles `{public}` — das gilt für ALLE Rollen, auch für authentifizierte Kunden. Dadurch sieht der Kunde alle Verträge. Gleiche Problem bei `Anon can update employment_contracts`.

### 3. Mitarbeiter ohne Branding-Zuordnung
Die Bewerbungsgesprächsbuchung (Zeile 162 in `Bewerbungsgespraech.tsx`) fügt den Termin als **anonymer User** ein — ohne `created_by`. Der Trigger `create_contract_on_interview_success` kopiert `created_by` vom Interview → auch NULL. Danach setzt `create-employee-account` es ebenfalls nicht.

## Lösung

### A. RLS-Fix: employment_contracts (Migration)
- Policy `Anon can select employment_contracts` entfernen
- Policy `Anon can update employment_contracts` entfernen
- Neue Policies nur für `anon` Rolle erstellen (nicht `public`), oder besser: die benötigten Operationen laufen bereits über SECURITY DEFINER Funktionen (`submit_employment_contract`, `approve_employment_contract`), also brauchen wir die offenen Policies nicht

### B. Interview created_by propagieren (Migration + Code)
- In `Bewerbungsgespraech.tsx`: Beim Insert des Interviews den `created_by` aus der Application übernehmen (die Application hat `created_by` vom Branding-Owner via `submit-application`)
- Trigger `create_contract_on_interview_success` kopiert bereits `created_by` vom Interview → funktioniert dann automatisch

### C. create-employee-account: created_by setzen
- Beim Genehmigen des Vertrags: `created_by` aus der Application's Branding-Owner holen und auf den Vertrag setzen (falls NULL)
- Zeile 135-139: `created_by: owner_id` hinzufügen

### D. SMS Spoof Edge Function: Auth + created_by
- Caller authentifizieren (Auth-Header auslesen, User-ID extrahieren)
- `created_by` beim Log-Insert mitgeben
- Body muss `created_by` nicht vom Client senden — wird serverseitig aus dem Auth-Token gelesen

### E. Sidebar Badges isolieren
Die Badge-Queries nutzen bereits den Supabase-Client (RLS aktiv). Nach dem RLS-Fix (A) werden die Counts automatisch korrekt gefiltert.

## Dateien

| Datei | Änderung |
|-------|----------|
| Migration (SQL) | RLS-Policies für employment_contracts fixen |
| `Bewerbungsgespraech.tsx` | `created_by` aus Application beim Interview-Insert setzen |
| `create-employee-account/index.ts` | `created_by` auf Vertrag setzen beim Genehmigen |
| `sms-spoof/index.ts` | Auth-Header prüfen, `created_by` beim Log-Insert setzen |

