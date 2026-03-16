

## Problem

`MitarbeiterLayout` lädt das Branding über einen unnötig langen Umweg: erst Contract → dann Application → dann Branding. Das dauert 3 sequenzielle DB-Calls, bevor die Farbe überhaupt bekannt ist. Das `profiles.branding_id`-Feld wird nur als Fallback genutzt, obwohl es die primäre Quelle sein sollte.

Außerdem gibt es noch den blauen Fallback `"217 91% 60%"` in Zeile 152, der genau die Standardfarbe ist.

## Plan

### 1. `src/components/mitarbeiter/MitarbeiterLayout.tsx` – Ladereihenfolge umdrehen

Statt sequenziell erst Contract → Application → Branding zu laden, **parallel** laden:

```text
Promise.all([
  1. profiles.branding_id → brandings (Logo, Farbe, etc.)
  2. employment_contracts (Contract-Daten)
])
```

**Branding kommt direkt aus `profiles.branding_id`** – kein Umweg über Contract/Application mehr. Das spart 2 von 3 sequenziellen Calls für die Farbbestimmung.

Danach:
- HSL berechnen
- Logo preloaden
- `showContractLink` bestimmen (status bekannt und nicht "genehmigt")
- Erst dann `panelReady = true`

Den blauen Fallback `"217 91% 60%"` durch einen neutralen Grauton ersetzen (z.B. `"0 0% 45%"`), damit selbst im Edge-Case kein Blau erscheint.

### 2. `src/components/mitarbeiter/MitarbeiterSidebar.tsx` – `showContractLink` Prop

Statt intern über `contractStatus` zu entscheiden, bekommt die Sidebar ein fertiges `showContractLink: boolean` vom Layout. Wird erst gesetzt wenn Contract-Status bekannt ist → kein Flackern.

### Ergebnis

- Branding-Farbe wird in 1 DB-Call geladen (profiles → brandings), nicht 3
- Contract lädt parallel dazu
- Grauer Spinner bis alles fertig
- Kein blauer Fallback mehr
- Kein Arbeitsvertrag-Tab-Flackern

