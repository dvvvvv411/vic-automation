

## Vertragsvorlage (Template-Titel) in Admin-Ansichten anzeigen

### Ziel
Wenn ein Mitarbeiter seine Vertragsvorlage gewählt hat (`template_id` in `employment_contracts`), soll der Titel der Vorlage aus `contract_templates` an drei Stellen angezeigt werden.

### Änderungen

**1. `AdminMitarbeiterDetail.tsx` — Übersicht-Tab, Persönliche Daten**
- Query erweitern: `select("*, applications(brandings(company_name)), contract_templates(title)")` (Join über `template_id`)
- Neues Feld in den `leftFields` oder `rightFields` der "Persönliche Daten"-Sektion einfügen: `{ key: "contract_templates.title", label: "Vertragsform" }` — da `EditableDualSection` nur flache Keys unterstützt, den Wert als berechnetes Feld im `data`-Objekt einsetzen (z.B. `contract.template_title = contract.contract_templates?.title`) und als nicht-editierbares Feld darstellen (read-only InfoRow nach den editierbaren Feldern).

**2. `AdminArbeitsvertraege.tsx` — Cards in der Liste**
- Query erweitern: `select("*, applications(...), contract_templates(title)")`
- In der Card unter den bestehenden Info-Zeilen (E-Mail, Telefon, Branding, Startdatum) eine weitere Zeile mit `FileText`-Icon und dem Template-Titel hinzufügen, wenn vorhanden.

**3. `AdminArbeitsvertraege.tsx` — Detail-Popup (Dialog)**
- Im "Persönliche Informationen"-Block eine neue `InfoRow` für "Vertragsform" mit dem Template-Titel einfügen.

**4. `MitarbeiterDetailPopup.tsx` — Popup-Detailansicht**
- Query erweitern: `select("*, applications(brandings(company_name)), contract_templates(title)")`
- `InfoRow` für "Vertragsform" in der "Persönliche Daten"-Card ergänzen.

### Keine DB-Migration nötig
Die Spalte `template_id` existiert bereits und `contract_templates` hat bereits eine `title`-Spalte. Es wird nur der Supabase-Join genutzt.

