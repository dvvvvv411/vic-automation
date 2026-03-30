

## Plan: Ausweis-Logik an Nationalitaet koppeln + Meldenachweis bei Reisepass erzwingen

### Aenderungen in `src/pages/mitarbeiter/MitarbeiterArbeitsvertrag.tsx`

**1. Reisepass = Meldenachweis Pflicht**
- Wenn `idType === "reisepass"`, wird der Meldenachweis-Upload automatisch angezeigt und ist Pflichtfeld
- Aktuell wird Meldenachweis nur angezeigt wenn `requiresProofOfAddress` aus der DB kommt
- Neu: `requiresProofOfAddress || idType === "reisepass"` als Bedingung fuer Anzeige und Validierung

**2. Nicht-deutsch = nur Reisepass**
- Wenn `form.nationality` nicht `"Deutsch"` ist, wird `idType` automatisch auf `"reisepass"` gesetzt
- Die Personalausweis-Option wird disabled oder ausgeblendet
- Beim Wechsel der Nationalitaet zurueck auf Deutsch wird die Auswahl wieder freigegeben
- Effect-Hook: wenn Nationalitaet sich aendert und nicht Deutsch ist, `setIdType("reisepass")` + Rueckseite entfernen

**3. Validierung (isStepValid, step 3)**
- `proofValid` Bedingung erweitern: `(requiresProofOfAddress || idType === "reisepass") ? (!!proofOfAddressFile || !!savedProofOfAddressUrl) : true`

### Betroffene Datei

| Datei | Aenderung |
|---|---|
| `MitarbeiterArbeitsvertrag.tsx` | useEffect fuer Nationalitaet→idType, RadioGroup disabled bei nicht-deutsch, Meldenachweis-Anzeige bei Reisepass, Validierung |

