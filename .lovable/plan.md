

## Plan: Meldenachweis im KYC-Tab anzeigen wenn hochgeladen

### Problem

Die Meldenachweis-Sektion im KYC-Tab wird nur angezeigt wenn `requires_proof_of_address === true`. Bei den genannten Mitarbeitern ist dieses Flag `false`, obwohl sie einen Meldenachweis hochgeladen haben (`proof_of_address_url` ist gesetzt). Das liegt daran, dass der Arbeitsvertrag-Flow den Upload durchführt, aber das Flag nicht auf `true` setzt.

### Lösung

**Datei: `src/pages/admin/AdminMitarbeiterDetail.tsx`**, Zeile 1013

Die Bedingung ändern von:
```typescript
{(contract as any).requires_proof_of_address && (
```
zu:
```typescript
{((contract as any).requires_proof_of_address || (contract as any).proof_of_address_url) && (
```

So wird der Meldenachweis-Bereich angezeigt wenn entweder das Flag aktiv ist ODER bereits eine Datei hochgeladen wurde.

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/pages/admin/AdminMitarbeiterDetail.tsx` | Bedingung erweitern: Meldenachweis zeigen wenn Flag aktiv ODER URL vorhanden |

