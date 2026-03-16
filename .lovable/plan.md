

# Fix: Arbeitsschritte aus der Beschreibung entfernen

## Problem
Das `description`-Feld in der Datenbank enthält Text mit "Arbeitsschritte:", der im Overview-Card (Auftragstitel + Beschreibung) angezeigt wird. Die Arbeitsschritte werden aber schon separat in einer eigenen Karte im Preparation-Step angezeigt, daher ist die Doppelung unerwünscht.

## Lösung

**Datei: `src/pages/mitarbeiter/AuftragDetails.tsx`**

Vor dem Rendern der Beschreibung den Text ab "Arbeitsschritte:" abschneiden, wenn das `work_steps`-Array separat vorhanden ist:

1. **Hilfsfunktion erstellen** (oberhalb der Komponente):
```typescript
const stripWorkStepsFromDescription = (desc: string, hasWorkSteps: boolean): string => {
  if (!hasWorkSteps) return desc;
  const idx = desc.indexOf("Arbeitsschritte:");
  if (idx === -1) return desc;
  return desc.slice(0, idx).trim();
};
```

2. **Anwenden an beiden Stellen**, wo `order.description` angezeigt wird:
   - **Overview-Step** (Zeile ~410): `order.description` durch `stripWorkStepsFromDescription(order.description, workSteps.length > 0)` ersetzen
   - Falls dieselbe Beschreibung auch im Preparation-Step gerendert wird, dort ebenfalls anwenden

3. **Leere Beschreibung ausblenden**: Wenn nach dem Strip ein leerer String übrig bleibt, den `<p>`-Tag nicht rendern.

