

# Ausnahmeregel: caller@vicpage.com sieht alle GUVI-Bewerbungsgespräche

## Kontext
- User: `7f509e3d-d5ab-459e-819c-c7ed6d392eef` (caller@vicpage.com, Rolle: admin)
- Branding: `cbb67ac3-f444-4f68-b5af-aee65d24068c` (GUVI GmbH & Co. KG)
- Aktuell sieht dieser Admin nur eigene Einträge (`created_by = auth.uid()`). Er soll ALLE Bewerbungsgespräche sehen, die zum GUVI-Branding gehören.

## Lösung

### 1. Daten einfügen (Insert-Tool)
Eintrag in `kunde_brandings` anlegen, um die Zuordnung User → GUVI-Branding herzustellen:
```sql
INSERT INTO kunde_brandings (user_id, branding_id)
VALUES ('7f509e3d-d5ab-459e-819c-c7ed6d392eef', 'cbb67ac3-f444-4f68-b5af-aee65d24068c');
```

### 2. Security-Definer-Funktion (Migration)
Neue Funktion `user_branding_ids(uuid)` erstellen, die alle Branding-IDs eines Users aus `kunde_brandings` zurückgibt. Verhindert RLS-Rekursion:
```sql
CREATE FUNCTION public.user_branding_ids(_user_id uuid) RETURNS SETOF uuid
SECURITY DEFINER ...
```

### 3. RLS-Policies anpassen (Migration)
Nur zwei Tabellen betroffen — `applications` und `interview_appointments`:

| Tabelle | Policy | Änderung |
|---------|--------|----------|
| `applications` | "Admins can select applications" | OR `branding_id IN (SELECT user_branding_ids(auth.uid()))` |
| `interview_appointments` | "Admins can select appointments" | OR `application_id IN (SELECT id FROM applications WHERE branding_id IN (SELECT user_branding_ids(auth.uid())))` |

Die bestehende `created_by`-Logik bleibt unverändert — die neue Bedingung wird nur als zusätzliches OR angehängt. Damit sieht `caller@vicpage.com` alle GUVI-Einträge, andere Admins sind nicht betroffen (sie haben keine `kunde_brandings`-Einträge).

### 4. Keine Code-Änderungen
Die Client-Queries bleiben unverändert. RLS filtert automatisch.

