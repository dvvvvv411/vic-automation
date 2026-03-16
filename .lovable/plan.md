

# Fixes für Festgehalt-Anzeige

## Probleme

1. **Dashboard Stats**: `employmentType` wird kleingeschrieben angezeigt (z.B. "minijob" statt "Minijob")
2. **MeineDaten - Gehaltsauszahlungen**: Zeigt "Voraussichtlicher Betrag" + Prämien-Summe statt Festgehalt
3. **MeineDaten - Statistiken**: Zeigt "Kontostand" statt Festgehalt
4. **MeineDaten - Verdienst-Historie**: Soll bei Festgehalt ausgeblendet werden

## Änderungen

### 1. `src/pages/mitarbeiter/MitarbeiterDashboard.tsx` (Zeile 315)

`employmentType` capitalisieren:

```typescript
detail: employmentType 
  ? employmentType.charAt(0).toUpperCase() + employmentType.slice(1) 
  : "Festgehalt"
```

### 2. `src/pages/mitarbeiter/MeineDaten.tsx`

**ContextType erweitern** (Zeile 18): `branding` muss `payment_model`, `salary_minijob`, `salary_teilzeit`, `salary_vollzeit` enthalten.

**Statistiken-Sektion** (Zeile 250): Bei Festgehalt statt "Kontostand" → "Festgehalt" mit dem entsprechenden Betrag anzeigen.

**Gehaltsauszahlungen** (Zeile 296): Bei Festgehalt "Betrag" statt "Voraussichtlicher Betrag" anzeigen, und den Festgehalt-Wert statt `pendingPayout`.

**Verdienst-Historie** (Zeile 307-340): Den gesamten Block bei Festgehalt ausblenden.

Dafür muss `employment_type` aus den Contract-Details geladen werden (wird bereits im Dashboard geladen, fehlt aber in MeineDaten). Festgehalt-Betrag wird anhand von `employment_type` + Branding-Salary-Feldern berechnet.

