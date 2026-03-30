

## Plan: Erster Arbeitstag von `application_id` auf `contract_id` umstellen

### Problem
Das gesamte 1.-Arbeitstag-System basiert auf `applications.id`. Das zwingt den Genehmigungsflow, eine Bewerbung zu erzeugen falls keine existiert (`ensureApplicationId`), was zu doppelten Bewerbungseintraegen fuehrt.

### Loesung
`first_workday_appointments` bekommt eine `contract_id`-Spalte. Die Route aendert sich von `/erster-arbeitstag/:applicationId` auf `/erster-arbeitstag/:contractId`. Alles laeuft ueber den Arbeitsvertrag.

### Aenderungen

**1. DB-Migration**
- `first_workday_appointments.contract_id UUID` hinzufuegen (nullable fuer Altdaten)
- Backfill: `UPDATE first_workday_appointments SET contract_id = ec.id FROM employment_contracts ec WHERE ec.application_id = first_workday_appointments.application_id`
- RLS-Policies anpassen: bestehende Policies beibehalten (die laufen ueber `application_id`), zusaetzlich `contract_id`-basierte Policies fuer INSERT/SELECT

**2. `src/pages/ErsterArbeitstag.tsx`**
- Statt `applications` laden: `employment_contracts` per `id` laden (mit `brandings`-Join ueber `branding_id`)
- Name, Telefon, E-Mail, Branding etc. direkt aus dem Vertrag lesen
- Booking-Mutation: `contract_id` statt `application_id` in `first_workday_appointments` einfuegen
- Bestehende Termine per `contract_id` statt `application_id` laden
- Gebuchte Slots: ueber `branding_id` direkt aus `first_workday_appointments` laden (nicht mehr ueber `applications`)

**3. `src/pages/admin/AdminArbeitsvertraege.tsx`**
- `ensureApplicationId` komplett entfernen
- `handleApprove`: Link direkt aus `contract.id` bauen: `/erster-arbeitstag/${contractId}`
- Copy-Link-Button: `/erster-arbeitstag/${selectedContract.id}`

**4. `src/pages/admin/AdminErsterArbeitstag.tsx`**
- Query umstellen: `first_workday_appointments` mit Join auf `employment_contracts` statt `applications!inner`
- Name, Telefon, E-Mail, Branding, Anstellungsart aus `employment_contracts` lesen

**5. `src/pages/admin/AdminProbetag.tsx`**
- Copy-Link-Button: statt `application_id` die verknuepfte `contract_id` aus `employment_contracts` holen und `/erster-arbeitstag/${contractId}` bauen

**6. `src/App.tsx`**
- Route bleibt `/erster-arbeitstag/:id`, nur die Semantik aendert sich (ist jetzt `contractId`)

### Ergebnis
- Keine `ensureApplicationId` mehr
- Keine Phantom-Bewerbungen
- Vertragsgenhmigung braucht keine `application_id`
- 1. Arbeitstag laeuft komplett ueber `employment_contracts`

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| DB-Migration | `contract_id` Spalte + Backfill + RLS |
| `src/pages/ErsterArbeitstag.tsx` | Komplett auf Vertragsdaten umstellen |
| `src/pages/admin/AdminArbeitsvertraege.tsx` | `ensureApplicationId` entfernen, Link aus `contract.id` |
| `src/pages/admin/AdminErsterArbeitstag.tsx` | Join auf `employment_contracts` statt `applications` |
| `src/pages/admin/AdminProbetag.tsx` | Copy-Link auf `contract_id` umstellen |

