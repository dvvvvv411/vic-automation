

# Arbeitsvertrag-Workflow umbauen

## Übersicht
Der Arbeitsvertrag-Flow wird vom externen Link (`/arbeitsvertrag/:id`) ins Mitarbeiter-Panel (`/mitarbeiter/arbeitsvertrag`) verschoben. Selbst-registrierte User bekommen automatisch Starter-Aufträge zugewiesen und können optional ihre Vertragsdaten ausfüllen.

## Änderungen

### 1. Automatische Starter-Auftrags-Zuweisung bei Registrierung
In `Auth.tsx` nach erfolgreichem `signUp`:
- Einen `employment_contract` anlegen (ohne `application_id` -- braucht Schema-Änderung, da `application_id` aktuell NOT NULL ist)
- Alternativ und besser: **DB-Trigger** oder direkt nach Registrierung: Alle Orders mit `is_starter_job = true` und passendem `branding_id` als `order_assignments` zuweisen

**Problem**: `employment_contracts.application_id` ist NOT NULL. Selbst-registrierte User haben keine Application. Wir müssen entweder:
- `application_id` nullable machen, oder
- einen neuen Ansatz ohne Contract für die Zuweisung wählen

Da der User aber trotzdem einen Contract braucht (für Chat, Aufträge, Dashboard etc.), ist der sauberste Weg: **`application_id` nullable machen** und bei der Registrierung direkt einen Employment Contract anlegen.

### 2. Migration
```sql
-- application_id nullable machen
ALTER TABLE public.employment_contracts ALTER COLUMN application_id DROP NOT NULL;

-- Funktion: Starter-Aufträge automatisch zuweisen
CREATE OR REPLACE FUNCTION public.assign_starter_jobs()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  INSERT INTO public.order_assignments (contract_id, order_id, status)
  SELECT NEW.id, o.id, 'offen'
  FROM public.orders o
  WHERE o.is_starter_job = true
    AND (o.branding_id = NEW.branding_id OR o.branding_id IS NULL)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_contract_assign_starter_jobs
  AFTER INSERT ON public.employment_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_starter_jobs();
```

### 3. Auth.tsx — Employment Contract bei Registrierung anlegen
Nach erfolgreichem `signUp` und Profil-Update:
```tsx
if (!error && data.user && brandingId) {
  // Create employment contract (without application)
  await supabase.from("employment_contracts").insert({
    user_id: data.user.id,
    branding_id: brandingId,
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    email: regEmail.trim(),
    phone: phone.trim() || null,
    status: "unterschrieben", // Skip contract signing flow
  });
}
```
Der DB-Trigger weist dann automatisch Starter-Aufträge zu.

### 4. MitarbeiterLayout — Contract-Signing-Zwang entfernen
Die Bedingung `contract?.status === "genehmigt" && contract?.contract_pdf_url` (Zeile 156) soll für selbst-registrierte User (ohne `application_id`) nicht greifen. Anpassung:
```tsx
{contract?.status === "genehmigt" && contract?.contract_pdf_url && contract?.application_id ? (
  <ContractSigningView ... />
) : (
  <main>
    <Outlet context={{ contract, branding, loading }} />
  </main>
)}
```

### 5. Neue Seite: `/mitarbeiter/arbeitsvertrag`
Neue Datei `src/pages/mitarbeiter/MitarbeiterArbeitsvertrag.tsx`:
- Stepper-Formular (gleiche Felder wie bisheriges `Arbeitsvertrag.tsx`)
- Vorausgefüllt: Vorname, Nachname, Email, Handynummer aus dem Contract
- Kein Zwang — der User navigiert selbst dorthin
- Bei Submit: `submit_employment_contract` RPC aufrufen (oder direktes Update)
- Nach Einreichung: Status auf "eingereicht" setzen

### 6. Dashboard-Card für Arbeitsvertrag
In `MitarbeiterDashboard.tsx` eine Card einfügen (nur wenn Contract-Status noch nicht "eingereicht"/"genehmigt"/"unterschrieben" mit submitted_at):
```tsx
{contract && !contractDetails?.submitted_at && (
  <Card className="border-l-4 border-l-amber-500">
    <CardContent className="py-5">
      <h3>Arbeitsvertragsdaten ausfüllen</h3>
      <p>Fülle deine persönlichen Daten aus, damit wir deinen Arbeitsvertrag erstellen können.</p>
      <Button onClick={() => navigate("/mitarbeiter/arbeitsvertrag")}>
        Jetzt ausfüllen
      </Button>
    </CardContent>
  </Card>
)}
```

### 7. Sidebar-Navigation erweitern
In `MitarbeiterSidebar.tsx` einen neuen Nav-Eintrag "Arbeitsvertrag" hinzufügen (Icon: `FileText`).

### 8. App.tsx — Neue Route registrieren
```tsx
<Route path="arbeitsvertrag" element={<MitarbeiterArbeitsvertrag />} />
```

## Betroffene Dateien
1. **Migration** — `application_id` nullable, Starter-Jobs Trigger
2. `src/pages/Auth.tsx` — Contract bei Registrierung anlegen
3. `src/components/mitarbeiter/MitarbeiterLayout.tsx` — Contract-Signing-Zwang anpassen
4. `src/pages/mitarbeiter/MitarbeiterArbeitsvertrag.tsx` — **Neue Datei**, Formular
5. `src/pages/mitarbeiter/MitarbeiterDashboard.tsx` — Hinweis-Card
6. `src/components/mitarbeiter/MitarbeiterSidebar.tsx` — Nav-Eintrag
7. `src/App.tsx` — Route hinzufügen

