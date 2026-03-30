

## Plan: Anstellungsart per Email-Lookup aus anderem Vertrag holen

### Problem
Der Termin haengt an einem leeren Draft-Vertrag. Der echte ausgefuellte Vertrag (z.B. mit "Minijob") hat dieselbe Email, aber eine andere `id`. Die bisherige Fallback-Kette greift nicht, weil sie nur den direkt verknuepften Vertrag prueft.

### Loesung in `AdminErsterArbeitstag.tsx`

Nach den bestehenden Follow-up-Queries eine **vierte Query** hinzufuegen:

1. Alle aufgeloesten Emails sammeln (aus `ec.email`, `profile.email`, `app.email`) wo `employmentType` noch fehlt
2. Per `supabase.from("employment_contracts").select("email, employment_type").in("email", [...emails]).not("employment_type", "is", null)` die ausgefuellten Vertraege laden
3. In `resolveItemData` als letzten Fallback vor `"–"` eine neue `contractsByEmailMap` nutzen

### Konkrete Aenderungen

**queryFn erweitern** (nach Zeile 142):
- Erste Runde: `resolveItemData` aufrufen um Emails zu ermitteln
- Emails sammeln wo `employmentType === "–"`
- Query: `employment_contracts` mit `.in("email", emails)` und `.not("employment_type", "is", null)` und `.eq("branding_id", activeBrandingId)`
- Map `email → employment_type` bauen
- In `resolveItemData` oder danach den Fallback anwenden

Da `resolveItemData` vor der Email-Query laeuft, wird die Logik **zweistufig**:
1. Erst normal resolven (wie jetzt)
2. Dann fuer alle Items mit `employmentType === "–"`: per Email in der `contractsByEmailMap` nachschauen

### Betroffene Datei

| Datei | Aenderung |
|---|---|
| `src/pages/admin/AdminErsterArbeitstag.tsx` | Email-basierte Nachschlage-Query fuer `employment_type` + zweistufiger Fallback |

