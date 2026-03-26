

## Plan: Anon DELETE Policy fuer trial_day_appointments

### Problem

Die Probetag-Seite hat bereits die komplette Umbuchungs-Logik (Button "Termin umbuchen", Loeschen des alten Termins, neuen Termin anlegen). Aber es fehlt die RLS DELETE Policy fuer `anon` auf `trial_day_appointments` — genau das gleiche Problem wie bei `interview_appointments`, das wir gerade gefixt haben.

### Aenderung

**DB-Migration:** Neue `anon` DELETE Policy auf `trial_day_appointments`.

```sql
CREATE POLICY "Anon can delete own trial appointment for rebooking"
ON public.trial_day_appointments
FOR DELETE
TO anon
USING (true);
```

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| DB-Migration | Neue `anon` DELETE Policy auf `trial_day_appointments` |

Kein Code muss geaendert werden — die Umbuchungs-UI und -Logik existiert bereits in `Probetag.tsx`.

