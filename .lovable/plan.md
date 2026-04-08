

## Plan: `submitted_at` beim initialen Laden abrufen

### Problem

`submitted_at` wird erst geladen wenn der Vertragsbereich aufgeklappt wird (Zeile 253), aber das Auszahlungsdatum (Zeile 372) braucht den Wert sofort. Deshalb fällt es auf den Fallback (15. des Monats) zurück.

### Lösung

**Datei: `src/pages/mitarbeiter/MeineDaten.tsx`**

In der initialen Query (Zeile 57-60) `submitted_at` zum Select hinzufügen:

```
.select("first_name, last_name, email, phone, street, zip_code, city, balance, iban, bic, bank_name, employment_type, submitted_at")
```

Dann in Zeile 73-75 den Wert in `contractExtra` setzen:

```typescript
if (contractRes.data) {
  setContractDetails(contractRes.data);
  setContractExtra(prev => ({ ...prev, submitted_at: contractRes.data.submitted_at ?? undefined }));
}
```

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/mitarbeiter/MeineDaten.tsx` | `submitted_at` in initiale Query aufnehmen und sofort in State setzen |

