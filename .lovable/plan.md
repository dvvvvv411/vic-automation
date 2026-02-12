

# Fix: Trigger fuer automatische Vertragserstellung registrieren

## Problem

Die Funktion `create_contract_on_interview_success()` existiert in der Datenbank, aber der zugehoerige **Trigger wurde nie auf der Tabelle `interview_appointments` erstellt**. Dadurch wird beim Markieren eines Bewerbungsgespraechs als "erfolgreich" kein Eintrag in `employment_contracts` angelegt -- und der kopierte Link fuehrt zu "Ungueltiger Link".

## Loesung

### 1. Migration: Trigger registrieren + fehlende Eintraege nachtraeglich anlegen

```sql
-- Trigger auf interview_appointments registrieren
CREATE TRIGGER on_interview_success
  AFTER UPDATE ON public.interview_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_contract_on_interview_success();

-- Bereits als erfolgreich markierte Termine nachtraeglich versorgen
INSERT INTO public.employment_contracts (application_id)
SELECT ia.application_id
FROM public.interview_appointments ia
WHERE ia.status = 'erfolgreich'
  AND NOT EXISTS (
    SELECT 1 FROM public.employment_contracts ec
    WHERE ec.application_id = ia.application_id
  );
```

Das ist die einzige Aenderung -- eine SQL-Migration. Kein Frontend-Code muss geaendert werden.

### Ergebnis

- Der bestehende Link `/arbeitsvertrag/0bbe3297-469c-4ce2-a3cb-054fdaf3dc46` wird sofort funktionieren (da der fehlende Eintrag nachgetragen wird)
- Zukuenftige "erfolgreich"-Markierungen erzeugen automatisch einen Contract-Eintrag via Trigger
