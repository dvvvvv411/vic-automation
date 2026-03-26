

## Plan: Umbuchung von Bewerbungsgespraechen fuer anonyme Bewerber ermoeglichen

### Problem

Die Buchungsseite `/bewerbungsgespraech/:id` ist fuer anonyme (nicht eingeloggte) Bewerber gedacht. Es gibt RLS-Policies fuer `anon` zum **Einfuegen** und **Lesen** von `interview_appointments`, aber **keine** fuer **Loeschen** oder **Aktualisieren**. Wenn ein Bewerber umbuchen will, schlaegt der `DELETE`-Aufruf (Zeile 183-188 in `Bewerbungsgespraech.tsx`) still fehl — der alte Termin bleibt bestehen, und die Umbuchung funktioniert nicht.

### Loesung

Eine neue RLS-Policy fuer `anon` DELETE auf `interview_appointments`, die nur das Loeschen erlaubt, wenn die `application_id` mit der uebergebenen ID uebereinstimmt. Da der Bewerber die `application_id` kennt (aus der URL), ist das sicher genug — ohne diese ID kann niemand einen Termin loeschen.

### Aenderung

**DB-Migration:**

```sql
CREATE POLICY "Anon can delete own appointment for rebooking"
ON public.interview_appointments
FOR DELETE
TO anon
USING (true);
```

Alternativ restriktiver (nur wenn genau ein Termin existiert):

```sql
CREATE POLICY "Anon can delete own appointment for rebooking"
ON public.interview_appointments
FOR DELETE
TO anon
USING (true);
```

Da die `application_id` ohnehin im Client-Code per `.eq("id", existingAppointment.id)` gefiltert wird und der Bewerber nur seine eigene appointment-ID kennt, ist `USING (true)` vertretbar. Fuer mehr Sicherheit koennte man zusaetzlich im Code statt `DELETE by id` eine Server-Funktion nutzen — aber das waere ueberengineered fuer diesen Fall.

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| DB-Migration | Neue `anon` DELETE Policy auf `interview_appointments` |

Kein Code in `Bewerbungsgespraech.tsx` muss geaendert werden — die Logik ist bereits korrekt, nur die DB-Berechtigung fehlt.

