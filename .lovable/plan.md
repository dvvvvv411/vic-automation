

## Plan: vertrag_genehmigt umfunktionieren & vertrag_unterzeichnet entfernen

### Aenderungen

**1. `vertrag_genehmigt` Email umfunktionieren**

Die Email wird weiterhin in `AdminArbeitsvertraege.tsx` nach `approve_employment_contract` gesendet, aber mit neuem Inhalt:
- Betreff: "Herzlichen Glueckwunsch – Sie sind nun vollwertiger Mitarbeiter"
- Body: Gratulation, Hinweis dass ab Startdatum Auftraege zugewiesen werden
- Kein "bitte unterzeichnen" mehr

Auch das Preview-Template in `AdminEmails.tsx` entsprechend anpassen.

**2. `vertrag_unterzeichnet` Email entfernen**

- `sign-contract/index.ts`: Email-Versand-Block (Zeilen 101-121) entfernen. Telegram-Notification bleibt bestehen.
- `AdminEmails.tsx`: `vertrag_unterzeichnet` Template aus der Preview-Liste entfernen.

### Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/pages/admin/AdminArbeitsvertraege.tsx` | Email-Text aendern: Gratulation + Startdatum-Hinweis |
| `supabase/functions/sign-contract/index.ts` | Email-Block entfernen (Zeilen 101-121), Telegram bleibt |
| `src/pages/admin/AdminEmails.tsx` | `vertrag_genehmigt` Preview-Text anpassen, `vertrag_unterzeichnet` Preview entfernen |

