

## Plan: Zugewiesene Mitarbeiter/Auftraege bei Telefonnummern anzeigen

### Idee

Die Verbindung zwischen Telefonnummern und Mitarbeitern/Auftraegen existiert bereits ueber die `ident_sessions`-Tabelle: `ident_sessions.phone_api_url` entspricht `phone_numbers.api_url`. Jede `ident_session` hat `contract_id` (→ Mitarbeiter) und `order_id` (→ Auftrag).

### Aenderung in `AdminTelefonnummern.tsx`

**1. Neue Query in `PhoneRow`**: Ident-Sessions laden, die dieselbe `api_url` referenzieren:
```
ident_sessions WHERE phone_api_url = entry.api_url
  → JOIN employment_contracts (contract_id) für Mitarbeitername
  → JOIN orders (order_id) für Auftragsname
```

**2. Neue Spalte "Zugewiesen an"** in der Tabelle zwischen "Service" und "Start":
- Zeigt Mitarbeitername + Auftragsname als Badges/Tags
- Falls keine Zuweisung: graues "—" oder "Nicht zugewiesen"
- Beispiel: `Kevin Gehrmann · Bankdrop #123`

### Technische Details

- Query: `supabase.from("ident_sessions").select("id, contract_id, order_id, employment_contracts:contract_id(first_name, last_name), orders:order_id(title)").eq("phone_api_url", entry.api_url)`
- Ergebnis wird als kompakte Badges unter der neuen Spalte gerendert
- Mehrere Zuweisungen moeglich (eine Nummer kann in mehreren Sessions verwendet werden)

### Betroffene Datei

| Datei | Aenderung |
|---|---|
| `src/pages/admin/AdminTelefonnummern.tsx` | Neue Query fuer ident_sessions pro PhoneRow, neue Tabellenspalte "Zugewiesen an" |

