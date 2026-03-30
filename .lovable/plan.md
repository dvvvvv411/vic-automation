

## Plan: Profil-Daten als Fallback fuer leere Vertraege

### Ursache

`create_contract_on_interview_success` legt Vertraege nur mit `application_id` und `created_by` an — ohne persoenliche Daten. Die kommen erst bei `submit_employment_contract`. Aber der Vertrag hat ein `user_id`-Feld, das auf `profiles` zeigt, wo `full_name`, `email` und `phone` bereits vorhanden sind.

### Loesung

In `AdminErsterArbeitstag.tsx` die Query erweitern, um auch `profiles` ueber `user_id` mitzuladen:

```
employment_contracts:contract_id!inner(
  id, first_name, last_name, email, phone, employment_type, branding_id, user_id,
  brandings:branding_id(id, company_name),
  profiles:user_id(full_name, email, phone)
)
```

Im Rendering dann Fallback-Logik:
- Name: `ec.first_name` / `ec.last_name` → falls leer, `ec.profiles?.full_name` splitten
- Email: `ec.email` → falls leer, `ec.profiles?.email`
- Telefon: `ec.phone` → falls leer, `ec.profiles?.phone`

### Betroffene Datei

| Datei | Aenderung |
|---|---|
| `src/pages/admin/AdminErsterArbeitstag.tsx` | Query um `profiles:user_id(...)` erweitern, Fallback-Rendering fuer Name/Email/Phone |

