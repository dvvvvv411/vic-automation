

# SMS nur ab Zuweisungszeitpunkt anzeigen

## Problem
Wenn dem User eine Telefonnummer zugewiesen wird, zeigt die Warteseite alle SMS an, die jemals auf dieser Nummer eingegangen sind. Stattdessen sollen nur SMS angezeigt werden, die **nach** dem Zeitpunkt der Zuweisung eingegangen sind.

## Lösung

### `src/pages/mitarbeiter/AuftragDetails.tsx`

Im `useEffect` für SMS-Fetching (Zeilen 200-225): Nach dem Sortieren die SMS filtern, sodass nur Nachrichten angezeigt werden, deren `messageDate` >= `identSession.updated_at` ist. Das `updated_at`-Feld der `ident_sessions` wird beim Zuweisen der Telefonnummer automatisch aktualisiert und dient als Referenzzeitpunkt.

```tsx
if (data?.sms) {
  const cutoff = new Date(identSession.updated_at).getTime();
  const sorted = [...data.sms]
    .filter((sms: AnosimSms) => new Date(sms.messageDate).getTime() >= cutoff)
    .sort(
      (a: AnosimSms, b: AnosimSms) => new Date(b.messageDate).getTime() - new Date(a.messageDate).getTime()
    );
  setSmsMessages(sorted);
}
```

### `src/pages/admin/AdminIdents.tsx`

Gleiche Logik anwenden: Beim Anzeigen der SMS in der Admin-Detailansicht ebenfalls nur SMS ab `updated_at` der Session filtern, damit Admin und User dasselbe sehen.

## Betroffene Dateien
| Datei | Änderung |
|-------|----------|
| `AuftragDetails.tsx` | SMS nach `updated_at` filtern |
| `AdminIdents.tsx` | SMS nach Session-Zuweisungszeitpunkt filtern |

