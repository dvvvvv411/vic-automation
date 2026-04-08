

## Plan: Stundenanzahl aus Vertragstitel statt Hardcoded-Werte

### Problem
Im AssignmentDialog (Zeile 277-280) sind die Stunden pro Woche hardcoded: Minijob=10h, Teilzeit=20h, Vollzeit=40h. Die tatsächliche Stundenanzahl steht im Titel der Vertragsvorlage (z.B. "Teilzeit 10 Stunden", "Minijob 5 Stunden").

### Lösung

**Datei: `src/components/admin/AssignmentDialog.tsx`**

1. **Query erweitern** (Zeile 76): `template_id` mit abfragen
2. **Template-Titel laden**: Zweite Query auf `contract_templates` mit den gesammelten `template_id`s, um den Titel zu holen
3. **Stunden aus Titel parsen**: Regex `(\d+)\s*Stunden` auf den Template-Titel anwenden
4. **Anzeige anpassen** (Zeile 277-291): Statt der hardcoded `meta`-Map den geparseten Wert aus dem Vertragstitel nutzen. Fallback auf den `employment_type` ohne Stundenangabe, falls kein Template vorhanden.

Konkret:
- In der Query zusätzlich `template_id` selektieren und als Property im Item-Objekt mitgeben
- Nach dem Laden der Contracts eine Batch-Query auf `contract_templates` machen um die Titel zu holen
- Im Render-Block: Template-Titel parsen → z.B. "Teilzeit 10 Stunden" → "Teilzeit · 10h/Woche"

### Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/components/admin/AssignmentDialog.tsx` | `template_id` laden, Template-Titel abfragen, Stunden daraus parsen statt hardcoded |

